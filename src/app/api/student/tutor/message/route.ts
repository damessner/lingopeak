import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { generateCompletion } from '@/lib/aiService';
import db from '@/lib/db';
import crypto from 'crypto';
import {
  getMemory,
  formatMemoryForPrompt,
  parseAndPersistMemoryUpdates,
  getGoals,
  formatGoalsForPrompt
} from '@/lib/hermesMemory';
import {
  getActiveNotes,
  formatNotesForPrompt,
  parseAndPersistCoachNotes,
  addCoachNote
} from '@/lib/coachNotes';
import { notifyTeacherStruggle } from '@/lib/teamsNotify';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check for clear chat action
    if (body.action === 'clear') {
      db.prepare('DELETE FROM tutor_messages WHERE student_id = ?').run(session.userId);
      return NextResponse.json({ success: true });
    }

    const { message, history } = body as {
      message: string;
      history: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Save the student's message to persistent history immediately
    const userMsgId = crypto.randomUUID();
    db.prepare('INSERT INTO tutor_messages (id, student_id, role, content) VALUES (?, ?, ?, ?)')
      .run(userMsgId, session.userId, 'user', message.trim());

    // ── Load student context ────────────────────────────────────────────────

    // Persistent Hermes memory
    const memory = getMemory(session.userId);
    const memoryBlock = formatMemoryForPrompt(memory);

    // Persistent active goals
    const goalsBefore = getGoals(session.userId);
    const goalsBlock = formatGoalsForPrompt(goalsBefore);

    // Persistent coach notes (excluding teacher observations)
    const notes = getActiveNotes(session.userId, 10, true);
    const notesBlock = formatNotesForPrompt(notes);

    // Recent struggles (score < 80)
    const struggles = db.prepare(`
      SELECT w.title as worksheet_title, c.name as category_name, a.score
      FROM attempts a
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories c ON w.category_id = c.id
      WHERE a.student_id = ? AND a.score < 80
      ORDER BY a.completed_at DESC
      LIMIT 3
    `).all(session.userId) as Array<{ worksheet_title: string; category_name: string; score: number }>;

    // Per-category mastery
    const categoryMastery = db.prepare(`
      SELECT c.name as category_name, AVG(a.score) as avg_score
      FROM attempts a
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories c ON w.category_id = c.id
      WHERE a.student_id = ?
      GROUP BY c.name
    `).all(session.userId) as Array<{ category_name: string; avg_score: number }>;

    // Calculate student average score across all attempts
    const avgScoreRow = db.prepare('SELECT AVG(score) as avg FROM attempts WHERE student_id = ?')
      .get(session.userId) as { avg: number | null };
    const overallAvgScore = avgScoreRow.avg !== null ? Math.round(avgScoreRow.avg) : null;

    let scaffoldingInstruction = '';
    let dbLevel = 'MODERATE';
    if (overallAvgScore !== null) {
      if (overallAvgScore > 80) {
        dbLevel = 'MINIMAL';
        scaffoldingInstruction = `\n[SCAFFOLDING LEVEL: MINIMAL SUPPORT (Student avg score is ${overallAvgScore}%)]\n- Give very minimal hints, pushing for high precision and correct terminology.\n- Encourage them to self-correct with light, brief prompts rather than breaking down sentences.`;
      } else if (overallAvgScore >= 60) {
        dbLevel = 'MODERATE';
        scaffoldingInstruction = `\n[SCAFFOLDING LEVEL: MODERATE SUPPORT (Student avg score is ${overallAvgScore}%)]\n- Guide them when they make mistakes, explaining *why* a grammatical structure is close but not quite right.\n- Confirm their understanding at each step before moving on.`;
      } else {
        dbLevel = 'MAXIMUM';
        scaffoldingInstruction = `\n[SCAFFOLDING LEVEL: MAXIMUM SUPPORT (Student avg score is ${overallAvgScore}%)]\n- Provide maximum scaffolding. Break down complex rules or sentences word-by-word.\n- Give extremely simple explanations and highly supportive, easy-to-understand hints.`;
      }

      // Persist the scaffolding level key in student memory
      db.prepare(`
        INSERT INTO student_memories (student_id, key, value, updated_at)
        VALUES (?, 'scaffolding_level', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(session.userId, dbLevel);
    }

    // ── Persistent Struggle & Escalation ──────────────────────────────────
    const repeatedStruggles = db.prepare(`
      SELECT c.name as category_name, COUNT(*) as fail_count
      FROM attempts a
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories c ON w.category_id = c.id
      WHERE a.student_id = ? AND a.score < 60 AND a.completed_at >= datetime('now', '-14 days')
      GROUP BY c.name
      HAVING fail_count >= 3
    `).all(session.userId) as Array<{ category_name: string; fail_count: number }>;

    for (const struggle of repeatedStruggles) {
      const catLower = struggle.category_name.toLowerCase();
      const alreadyLogged = db.prepare(`
        SELECT id FROM coach_notes
        WHERE student_id = ? AND category = ? AND priority = 'high'
          AND created_at >= datetime('now', '-14 days')
        LIMIT 1
      `).get(session.userId, catLower);

      if (!alreadyLogged) {
        const noteContent = `Student has failed 3+ attempts in ${struggle.category_name} in the last 14 days. Handover to human teacher recommended.`;
        addCoachNote(session.userId, struggle.category_name, noteContent, 'high', 'ai');

        if (session.classId) {
          const teacher = db.prepare(`
            SELECT u.username, u.teams_webhook_url
            FROM users u
            JOIN classes c ON c.teacher_id = u.id
            WHERE c.id = ?
          `).get(session.classId) as { username: string; teams_webhook_url: string | null } | undefined;

          if (teacher?.teams_webhook_url) {
            try {
              await notifyTeacherStruggle({
                webhookUrl: teacher.teams_webhook_url,
                teacherName: teacher.username,
                studentName: session.username,
                topicName: struggle.category_name,
                score: 50,
                platformUrl: process.env.NEXT_PUBLIC_APP_URL
              });
            } catch (err) {
              console.error('Failed to notify teacher of persistent struggle:', err);
            }
          }
        }
      }
    }

    // ── Uncertainty Check ──────────────────────────────────────────────────
    const uncertaintyRegex = /\b(not sure|don't know|dont know|confused|too hard|can't do|cant do|don't understand|dont understand|am i right|is this right)\b/i;
    if (uncertaintyRegex.test(message)) {
      const todayStr = new Date().toISOString().split('T')[0];
      const alreadyLoggedToday = db.prepare(`
        SELECT id FROM coach_notes
        WHERE student_id = ? AND category = 'confidence' AND created_at >= ?
        LIMIT 1
      `).get(session.userId, todayStr + ' 00:00:00');

      if (!alreadyLoggedToday) {
        addCoachNote(
          session.userId,
          'confidence',
          `Student expressed uncertainty or difficulty: "${message.trim()}"`,
          'normal',
          'ai'
        );
      }
    }

    // ── Session Modulo Turns ───────────────────────────────────────────────
    const msgCountRow = db.prepare('SELECT COUNT(*) as count FROM tutor_messages WHERE student_id = ?').get(session.userId) as { count: number };
    const totalMessages = msgCountRow.count;

    let sessionSummaryInstruction = '';
    if (totalMessages > 0 && totalMessages % 5 === 0) {
      sessionSummaryInstruction = `\n\n[CRITICAL SYSTEM INSTRUCTION]\n- This is the 5th message block of this interaction segment. You MUST generate a brief narrative summary of the student's recent performance, grammar retention, or engagement, and persist it by appending this tag at the very end of your response: <!--COACH_NOTE:{"category":"general","content":"[your summary here]","priority":"normal"}-->. Make it concise (1-2 sentences) and professional.`;
    }

    let struggleContext = '';
    if (struggles.length > 0) {
      struggleContext = `\n\nRecent Student Gaps & Mistakes (Help the student practice these topics contextually):\n` +
        struggles.map(s => `- Worksheet: "${s.worksheet_title}" (${s.category_name}) - Score: ${s.score}%`).join('\n') +
        `\nTailor your guidance to sneak in practice or questions addressing these specific grammar/vocabulary gaps, without explicitly calling out their scores unless they ask.`;
    }

    let masteryContext = '';
    if (categoryMastery.length > 0) {
      masteryContext = `\nStudent Mastery Levels per Category:\n` +
        categoryMastery.map(cm => `- ${cm.category_name}: ${Math.round(cm.avg_score)}%`).join('\n');
    }

    // ── Build System Prompt ─────────────────────────────────────────────────
    const systemPrompt = `You are Coach, a friendly, highly persistent, encouraging, and Socratic AI ESL (English as a Second Language) Coach on the LingoPeak platform.
Your goal is to help the student learn English naturally, dynamically, and through Socratic reasoning.
CRITICAL: You NEVER give direct answers.
Rules:
- If a student asks "What's the past tense of go?" → Ask "What do you remember about irregular verbs?"
- If they answer wrong → "Close! Think about words that change completely, like sing→sang."
- If they're stuck → Give a hint about the rule, never the word: "Go is an irregular verb. It doesn't follow the -ed rule."
- If they get it right → "Exactly! Now try it in a sentence: Yesterday, I ___ to the park."
- Use the student's struggle data to pick examples from categories they've failed before.
- When the student asks for help on a specific worksheet question: reference the question type and guide them through the reasoning without revealing the answer.
- Communicate in clear, supportive, and accessible English matching their student status and scaffolding level.
- Keep responses relatively brief (1-3 paragraphs) to avoid overwhelming the learner.
- Correct grammar or spelling mistakes politely if you notice them in the student's text, guiding them to self-correct.
- Provide word stress guides in capital letters inside brackets for multi-syllabic vocabulary words that may be difficult (e.g., de-VEL-op, pho-to-GRAPH-ic, par-TIC-u-lar) to guide the student's pronunciation.
- When the student shares a personal goal, name, preferred topic, or important fact, embed a <!--MEMORY_UPDATE:{"key":"value"}--> tag at the very end of your reply (hidden from the student). Use snake_case keys like "learning_goal", "name", "weak_area", "last_topic". Never show these tags directly.
- Goal Update Rule: When the student shares a learning goal, create a unique goal ID (e.g. goal_1234) and save it in memory with: <!--MEMORY_UPDATE:{"goal_1234":"{\\\"text\\\":\\\"improve past tense\\\",\\\"created\\\":\\\"2026-05-31\\\",\\\"status\\\":\\\"active\\\"}"}-->.
- Goal Completion Rule: When a student says they've mastered a skill or completed a goal, confirm with them first: "Would you like to mark '[goal_text]' as complete?". Only mark it complete (by outputting status 'completed' in a memory update tag like <!--MEMORY_UPDATE:{"goal_[id]":"{\\\"text\\\":\\\"...\\\",\\\"created\\\":\\\"...\\\",\\\"status\\\":\\\"completed\\\"}"}-->) if they explicitly agree. Do NOT mark a goal complete unilaterally.
- When you want to assign/create a practice worksheet for a student (e.g. because they need more practice on a topic), embed a <!--CREATE_PRACTICE:{"category":"GRAMMAR", "topic":"present perfect"}--> tag in your reply. Note: valid categories are GRAMMAR, VOCABULARY, READING, WRITING, LISTENING.
${scaffoldingInstruction}${struggleContext}${masteryContext}${notesBlock}${goalsBlock}${memoryBlock}${sessionSummaryInstruction}`;

    // Format dialogue history
    const formattedHistory = (history || [])
      .map(m => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.content}`)
      .join('\n');

    const promptText = `${systemPrompt}\n\n${formattedHistory}\nStudent: ${message.trim()}\nCoach:`;

    // ── Invoke AI ───────────────────────────────────────────────────────────
    const rawReply = await generateCompletion(promptText, false);

    // Parse + persist any memory updates hidden in the reply, strip tags from student-visible text
    let cleanReply = parseAndPersistMemoryUpdates(session.userId, rawReply.trim());

    // Check if any goals transitioned from active to completed
    const goalsAfter = getGoals(session.userId);
    for (const goalAfter of goalsAfter) {
      const goalBefore = goalsBefore.find(g => g.key === goalAfter.key);
      if (goalAfter.status === 'completed' && (!goalBefore || goalBefore.status === 'active')) {
        const noteContent = `Student successfully completed learning goal: "${goalAfter.text}".`;
        addCoachNote(session.userId, 'general', noteContent, 'high', 'ai');
      }
    }

    // Parse + persist any coach notes hidden in the reply, strip tags from student-visible text
    cleanReply = parseAndPersistCoachNotes(session.userId, cleanReply);

    // Parse + generate any worksheets requested by the AI inline
    const practicePattern = /<!--CREATE_PRACTICE:(.*?)-->/i;
    const practiceMatch = practicePattern.exec(cleanReply);
    if (practiceMatch) {
      try {
        const { category, topic } = JSON.parse(practiceMatch[1]);
        if (category && topic) {
          const categoryRow = db.prepare('SELECT id FROM categories WHERE name = ? LIMIT 1')
            .get(category.toUpperCase()) as { id: string } | undefined;
          if (categoryRow) {
            const worksheetId = crypto.randomUUID();
            const count = 3;
            const generatorPrompt = `You are an expert ESL curriculum designer creating a personalized practice worksheet for LingoPeak.
Generate exactly ${count} questions about the topic: "${topic.trim()}"
Question type: multiple_choice

Return ONLY a valid JSON object (no markdown, no explanation) in this format:
{
  "worksheetTitle": "...",
  "instructions": "...",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}
Return valid JSON only.`;
            const rawWS = await generateCompletion(generatorPrompt, true);
            const cleanedWS = rawWS.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            const parsedWS = JSON.parse(cleanedWS);
            const normalisedQuestions = (parsedWS.questions ?? []).map((q: any, idx: number) => ({
              id: `q_practice_${idx}`,
              type: 'multiple_choice',
              question: q.question ?? '',
              options: q.options ?? [],
              correctAnswer: q.correctAnswer ?? '',
              explanation: q.explanation ?? ''
            }));

            db.prepare(`
              INSERT INTO worksheets (id, category_id, title, tier, questions_json, badge_emoji)
              VALUES (?, ?, ?, 'SUMMIT', ?, '⚡')
            `).run(
              worksheetId,
              categoryRow.id,
              parsedWS.worksheetTitle ?? `Practice: ${topic}`,
              JSON.stringify(normalisedQuestions)
            );

            const worksheetLink = `[📝 Open Practice Worksheet: ${parsedWS.worksheetTitle ?? topic}](/student/worksheets/${worksheetId})`;
            cleanReply = cleanReply.replace(practicePattern, `\n\n${worksheetLink}`).trim();
          } else {
            cleanReply = cleanReply.replace(practicePattern, '').trim();
          }
        }
      } catch (e) {
        console.error('Failed to auto-create practice worksheet:', e);
        cleanReply = cleanReply.replace(practicePattern, '').trim();
      }
    }

    // Save assistant reply to persistent history
    const assistantMsgId = crypto.randomUUID();
    db.prepare('INSERT INTO tutor_messages (id, student_id, role, content) VALUES (?, ?, ?, ?)')
      .run(assistantMsgId, session.userId, 'assistant', cleanReply);

    return NextResponse.json({
      success: true,
      reply: cleanReply
    });
  } catch (err: any) {
    console.error('Tutor message error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
