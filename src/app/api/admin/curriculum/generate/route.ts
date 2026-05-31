/**
 * POST /api/admin/curriculum/generate
 *
 * Uses DeepSeek V4 Flash (via OpenCode Zen) to generate a full worksheet
 * scaffold for a given topic + question type, and saves it as a draft
 * worksheet with questions pre-populated into `questions_json` — the same
 * format the student player reads.
 *
 * Body: { topic: string; questionType: string; level: 'A1'|'A2'|'B1'|'B2'; count?: number; categoryId?: string }
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { generateCompletion } from '@/lib/aiService';
import db from '@/lib/db';
import crypto from 'crypto';

const ALLOWED_ROLES = ['TEACHER', 'ADMIN'];

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get('session')?.value ?? '');

  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    topic,
    questionType,
    level = 'A2',
    count = 5,
    categoryId
  } = await req.json() as {
    topic: string;
    questionType: string;
    level?: string;
    count?: number;
    categoryId?: string;
  };

  if (!topic?.trim() || !questionType?.trim()) {
    return NextResponse.json({ error: 'topic and questionType are required' }, { status: 400 });
  }

  const cappedCount = Math.min(Math.max(Number(count) || 5, 1), 10);

  const prompt = `You are an expert ESL curriculum designer creating worksheets for the LingoPeak platform.

Generate exactly ${cappedCount} questions about the topic: "${topic.trim()}"
CEFR Level: ${level}
Question type: ${questionType}

Return ONLY a valid JSON object (no markdown, no explanation) in this format:
{
  "worksheetTitle": "...",
  "instructions": "...",
  "questions": [
    {
      "type": "${questionType}",
      "question": "...",
      "options": ["...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}

Rules:
- For multiple_choice: provide 4 options, one correct.
- For fill_in_the_blank: use ___ in the question string, correctAnswer is the missing word.
- For true_false: options = ["True","False"], correctAnswer = "True" or "False".
- For short_answer / writing: omit options, correctAnswer is a sample answer.
- For matching: question = term, correctAnswer = its matching definition (pairs).
- Keep language appropriate for ${level} learners.
- Return valid JSON only.`;

  let raw: string;
  try {
    raw = await generateCompletion(prompt, true);
  } catch (err: any) {
    return NextResponse.json({ error: `AI generation failed: ${err.message}` }, { status: 502 });
  }

  let parsed: any;
  try {
    // Strip ```json fences if model added them despite json mode
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: 'AI returned invalid JSON. Try again.', raw },
      { status: 422 }
    );
  }

  // Normalise questions to match the format the student player expects:
  // { id, type, question, options?, correctAnswer, explanation? }
  const normalisedQuestions = (parsed.questions ?? []).map((q: any, idx: number) => ({
    id: `q_ai_${idx}`,
    type: q.type ?? questionType,
    question: q.question ?? q.prompt ?? '',   // accept both field names from AI
    ...(q.options?.length ? { options: q.options } : {}),
    correctAnswer: q.correctAnswer ?? '',
    ...(q.explanation ? { explanation: q.explanation } : {})
  }));

  // If categoryId provided, save directly into worksheets.questions_json
  // so the student player can render it immediately — no separate questions table.
  if (categoryId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json({ error: 'Invalid categoryId format' }, { status: 400 });
    }

    const worksheetId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO worksheets (id, category_id, title, tier, questions_json, badge_emoji)
      VALUES (?, ?, ?, 'CUSTOM', ?, '🤖')
    `).run(
      worksheetId,
      categoryId,
      parsed.worksheetTitle ?? topic,
      JSON.stringify(normalisedQuestions)
    );

    return NextResponse.json({
      success: true,
      worksheetId,
      worksheetTitle: parsed.worksheetTitle ?? topic,
      questionCount: normalisedQuestions.length,
      message: `Draft worksheet saved with ${normalisedQuestions.length} questions. Open it in the builder to review.`
    });
  }

  // No categoryId → return the scaffold for preview in the builder
  return NextResponse.json({
    success: true,
    scaffold: {
      ...parsed,
      questions: normalisedQuestions
    }
  });
}
