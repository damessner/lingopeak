import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { generateCompletion } from '@/lib/aiService';
import db from '@/lib/db';
import crypto from 'crypto';

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

    // Query recent struggles for context injection
    const struggles = db.prepare(`
      SELECT w.title as worksheet_title, c.name as category_name, a.score
      FROM attempts a
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories c ON w.category_id = c.id
      WHERE a.student_id = ? AND a.score < 80
      ORDER BY a.completed_at DESC
      LIMIT 3
    `).all(session.userId) as Array<{ worksheet_title: string; category_name: string; score: number }>;

    // Query category mastery levels for context injection
    const categoryMastery = db.prepare(`
      SELECT c.name as category_name, AVG(a.score) as avg_score
      FROM attempts a
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories c ON w.category_id = c.id
      WHERE a.student_id = ?
      GROUP BY c.name
    `).all(session.userId) as Array<{ category_name: string; avg_score: number }>;

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

    // 1. Construct System Prompt
    const systemPrompt = `You are Hermes, a friendly, highly persistent, and encouraging AI ESL (English as a Second Language) Tutor on the LingoPeak platform.
Your goal is to help the student learn English naturally and dynamically.
Follow these guidelines:
- Communicate in clear, supportive, and accessible English matching their student status.
- Use scaffolding: ask encouraging follow-up questions and prompt them to correct their own typos or grammar slips rather than giving the answer away instantly.
- Speak in a friendly, conversational tone. Keep responses relatively brief (1-3 paragraphs) to avoid overwhelming the learner.
- Correct grammar or spelling mistakes politely if you notice them in the student's text.
- Provide word stress guides in capital letters inside brackets for multi-syllabic vocabulary words that may be difficult (e.g., de-VEL-op, pho-to-GRAPH-ic, par-TIC-u-lar) to guide the student's pronunciation.${struggleContext}${masteryContext}`;

    // 2. Format historical dialogue for completion prompt
    const formattedHistory = (history || [])
      .map(m => `${m.role === 'user' ? 'Student' : 'Hermes'}: ${m.content}`)
      .join('\n');

    const promptText = `${systemPrompt}\n\n${formattedHistory}\nStudent: ${message.trim()}\nHermes:`;

    // 3. Invoke aiService (uses configured OpenCode Zen provider)
    const reply = await generateCompletion(promptText, false);
    const cleanReply = reply.trim();

    // Save the assistant's reply to persistent history
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
