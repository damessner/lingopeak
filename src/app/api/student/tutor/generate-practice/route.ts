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
    const { categoryName, topic, count = 3 } = await req.json() as {
      categoryName: string;
      topic: string;
      count?: number;
    };

    if (!categoryName?.trim() || !topic?.trim()) {
      return NextResponse.json({ error: 'categoryName and topic are required' }, { status: 400 });
    }

    // 1. Fetch category ID
    const categoryRow = db.prepare('SELECT id FROM categories WHERE name = ? LIMIT 1')
      .get(categoryName.toUpperCase()) as { id: string } | undefined;

    if (!categoryRow) {
      return NextResponse.json({ error: `Category '${categoryName}' not found` }, { status: 404 });
    }

    const cappedCount = Math.min(Math.max(Number(count) || 3, 1), 10);
    const worksheetId = crypto.randomUUID();

    // 2. Generate worksheet questions using AI
    const prompt = `You are an expert ESL curriculum designer creating a personalized practice worksheet for the LingoPeak platform.
Generate exactly ${cappedCount} multiple choice questions about the topic: "${topic.trim()}"
Keep it appropriate for middle/high school English learners.

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

    let raw: string;
    try {
      raw = await generateCompletion(prompt, true);
    } catch (err: any) {
      return NextResponse.json({ error: `AI generation failed: ${err.message}` }, { status: 502 });
    }

    let parsed: any;
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON. Try again.', raw }, { status: 422 });
    }

    const normalisedQuestions = (parsed.questions ?? []).map((q: any, idx: number) => ({
      id: `q_practice_${idx}`,
      type: 'multiple_choice',
      question: q.question ?? '',
      options: q.options ?? [],
      correctAnswer: q.correctAnswer ?? '',
      explanation: q.explanation ?? ''
    }));

    // 3. Insert into worksheets table
    db.prepare(`
      INSERT INTO worksheets (id, category_id, title, tier, questions_json, badge_emoji)
      VALUES (?, ?, ?, 'SUMMIT', ?, '⚡')
    `).run(
      worksheetId,
      categoryRow.id,
      parsed.worksheetTitle ?? `Practice: ${topic}`,
      JSON.stringify(normalisedQuestions)
    );

    return NextResponse.json({
      success: true,
      worksheetId,
      worksheetTitle: parsed.worksheetTitle ?? `Practice: ${topic}`,
      questionCount: normalisedQuestions.length
    });
  } catch (err: any) {
    console.error('Manual practice generator error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
