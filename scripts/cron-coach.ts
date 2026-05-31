/**
 * cron-coach.ts
 *
 * Hermes background coaching daemon.
 * Run with:  npx tsx scripts/cron-coach.ts
 * 
 * Responsibilities:
 *  1. Scan every student's recent attempts → detect struggles (avg < 70)
 *  2. Generate a personalised tip via DeepSeek V4 Flash (OpenCode Zen)
 *  3. Save the tip as a tutor_message (origin = 'cron') so it surfaces in chat
 *  4. Alert the class teacher via MS Teams Incoming Webhook if enabled
 *  5. Run weekly class-average report to teacher
 *
 * Recommended cron schedule (crontab or Task Scheduler):
 *   0 8 * * 1-5   (Mon–Fri at 08:00)
 *   0 17 * * 5    (Friday 17:00 for weekly report)
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTeamsNotification, notifyTeacherStruggle, notifyTeacherWeeklyReport } from '../src/lib/teamsNotify.js';

// ── DB connection ─────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../lingopeak.db');
const db = new Database(DB_PATH);

// ── AI helper (lightweight, no Next.js imports) ───────────────────────────────

async function callAI(prompt: string): Promise<string> {
  const url = process.env.AI_ENDPOINT_URL || 'https://api.opencode.ai/v1/chat/completions';
  const model = process.env.AI_MODEL_NAME || 'deepseek-v4-flash';
  const apiKey = process.env.AI_API_KEY || '';

  if (!apiKey) throw new Error('AI_API_KEY is not set');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  username: string;
  class_id: string | null;
}

interface Struggle {
  category_name: string;
  avg_score: number;
  attempt_count: number;
}

interface Teacher {
  id: string;
  username: string;
  teams_webhook_url: string | null;
}

// ── Per-student coaching logic ───────────────────────────────────────────────

async function processStudent(student: Student): Promise<void> {
  // Get recent struggles (last 14 days, avg < 70)
  const struggles = db.prepare(`
    SELECT c.name as category_name, AVG(a.score) as avg_score, COUNT(*) as attempt_count
    FROM attempts a
    JOIN worksheets w ON a.worksheet_id = w.id
    JOIN categories c ON w.category_id = c.id
    WHERE a.student_id = ?
      AND a.completed_at >= datetime('now', '-14 days')
    GROUP BY c.name
    HAVING avg_score < 70
    ORDER BY avg_score ASC
    LIMIT 2
  `).all(student.id) as Struggle[];

  if (struggles.length === 0) {
    console.log(`  [${student.username}] No struggles detected — skipping.`);
    return;
  }

  const topStruggle = struggles[0];

  // Generate a personalised coaching tip
  const prompt = `You are Hermes, a friendly ESL tutor on LingoPeak. 
Student "${student.username}" is struggling with "${topStruggle.category_name}" (avg score: ${Math.round(topStruggle.avg_score)}% over ${topStruggle.attempt_count} attempts).
Write a short, encouraging coaching tip (2-3 sentences) they will see in their tutor chat when they log in today.
Make it specific to the topic, practical, and warm. Do NOT mention scores or statistics to the student.`;

  const tip = await callAI(prompt);
  if (!tip.trim()) return;

  // Save to tutor_messages so it surfaces in the chat UI
  const msgId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO tutor_messages (id, student_id, role, content, origin, created_at)
    VALUES (?, ?, 'assistant', ?, 'cron', CURRENT_TIMESTAMP)
  `).run(msgId, student.id, tip.trim());

  console.log(`  [${student.username}] Coaching tip saved for "${topStruggle.category_name}".`);

  // Alert teacher via MS Teams if they have a webhook
  if (student.class_id) {
    const teacher = db.prepare(`
      SELECT u.id, u.username, u.teams_webhook_url
      FROM users u
      JOIN classes c ON c.teacher_id = u.id
      WHERE c.id = ?
    `).get(student.class_id) as Teacher | undefined;

    if (teacher?.teams_webhook_url) {
      await notifyTeacherStruggle({
        webhookUrl: teacher.teams_webhook_url,
        teacherName: teacher.username,
        studentName: student.username,
        topicName: topStruggle.category_name,
        score: Math.round(topStruggle.avg_score),
        platformUrl: process.env.NEXT_PUBLIC_APP_URL
      });
      console.log(`  [${student.username}] Teacher "${teacher.username}" notified via MS Teams.`);
    }
  }
}

// ── Daily coaching loop (parallel batches of 5) ───────────────────────────────

async function runDailyCoach(): Promise<void> {
  console.log('[cron-coach] Starting daily coaching run…');

  const students = db
    .prepare("SELECT id, username, class_id FROM users WHERE role = 'STUDENT'")
    .all() as Student[];

  console.log(`[cron-coach] Found ${students.length} students.`);

  const BATCH_SIZE = 5;
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(s => processStudent(s)));
    results.forEach((r, j) => {
      if (r.status === 'rejected') {
        console.error(`  [${batch[j].username}] Error:`, r.reason);
      }
    });
  }

  console.log('[cron-coach] Daily run complete.');
}

// ── Weekly class report ───────────────────────────────────────────────────────

async function runWeeklyReport(): Promise<void> {
  console.log('[cron-coach] Running weekly teacher reports…');

  const teachers = db
    .prepare("SELECT id, username, teams_webhook_url FROM users WHERE role = 'TEACHER' AND teams_webhook_url IS NOT NULL")
    .all() as Teacher[];

  for (const teacher of teachers) {
    if (!teacher.teams_webhook_url) continue;

    try {
      // Get class IDs for this teacher
      const classes = db.prepare('SELECT id FROM classes WHERE teacher_id = ?').all(teacher.id) as { id: string }[];
      if (classes.length === 0) continue;

      const classIds = classes.map(c => `'${c.id}'`).join(',');

      const stats = db.prepare(`
        SELECT
          ROUND(AVG(a.score), 1) as class_avg,
          COUNT(DISTINCT CASE WHEN avg_scores.avg_score < 60 THEN a.student_id END) as at_risk
        FROM attempts a
        JOIN users u ON a.student_id = u.id AND u.class_id IN (${classIds})
        JOIN (
          SELECT student_id, AVG(score) as avg_score FROM attempts
          WHERE completed_at >= datetime('now', '-7 days')
          GROUP BY student_id
        ) avg_scores ON avg_scores.student_id = a.student_id
        WHERE a.completed_at >= datetime('now', '-7 days')
      `).get() as { class_avg: number; at_risk: number } | undefined;

      const topStruggleRow = db.prepare(`
        SELECT c.name as category_name, AVG(a.score) as avg_score
        FROM attempts a
        JOIN worksheets w ON a.worksheet_id = w.id
        JOIN categories c ON w.category_id = c.id
        JOIN users u ON a.student_id = u.id AND u.class_id IN (${classIds})
        WHERE a.completed_at >= datetime('now', '-7 days')
        GROUP BY c.name
        ORDER BY avg_score ASC
        LIMIT 1
      `).get() as { category_name: string } | undefined;

      await notifyTeacherWeeklyReport({
        webhookUrl: teacher.teams_webhook_url,
        classAvg: stats?.class_avg ?? 0,
        studentsAtRisk: stats?.at_risk ?? 0,
        topStruggle: topStruggleRow?.category_name ?? 'N/A',
        platformUrl: process.env.NEXT_PUBLIC_APP_URL
      });

      console.log(`  [${teacher.username}] Weekly report sent.`);
    } catch (err) {
      console.error(`  [${teacher.username}] Weekly report error:`, err);
    }
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const mode = process.argv[2] ?? 'daily';

if (mode === 'weekly') {
  runWeeklyReport().catch(console.error);
} else {
  runDailyCoach().catch(console.error);
}
