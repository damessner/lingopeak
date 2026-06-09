import db from '@/lib/db';
import { generateCompletion } from '@/lib/aiService';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 5 requests per 5 minutes
    const limiter = rateLimit(request, 'summit_generate', 5, 5 * 60 * 1000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many worksheet generation requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limiter.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }
    // Authorize session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const { studentId, categoryId } = await request.json();

    if (!studentId || !categoryId) {
      return NextResponse.json({ error: 'studentId and categoryId are required' }, { status: 400 });
    }

    // Students cannot generate summits for other students
    if (session.role === 'STUDENT' && session.userId !== studentId) {
      return NextResponse.json({ error: 'Forbidden: Cannot generate worksheets for another student' }, { status: 403 });
    }

    // 1. Fetch category and unit details
    const category = db.prepare(`
      SELECT c.name, u.title as unit_title 
      FROM categories c 
      JOIN units u ON c.unit_id = u.id 
      WHERE c.id = ?
    `).get(categoryId) as any;

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // 2. Fetch student's attempts in this category
    const attempts = db.prepare(`
      SELECT a.score, a.answers_json, w.title as worksheet_title, w.questions_json 
      FROM attempts a 
      JOIN worksheets w ON a.worksheet_id = w.id 
      WHERE a.student_id = ? AND w.category_id = ? AND w.tier != 'SUMMIT'
    `).all(studentId, categoryId) as any[];

    if (attempts.length === 0) {
      return NextResponse.json({ error: 'Student must complete explorer/voyager/challenger attempts first' }, { status: 400 });
    }

    // 3. Compile context for AI
    const studentHistory = attempts.map((att) => ({
      worksheet: att.worksheet_title,
      score: att.score,
      questions: JSON.parse(att.questions_json),
      studentAnswers: JSON.parse(att.answers_json)
    }));

    const prompt = `
You are an expert ESL (English as a Second Language) teacher. 
A student has finished practicing exercises in Unit category: "${category.name}".
Here is their performance history, showing the questions asked and their answers:
${JSON.stringify(studentHistory, null, 2)}

Analyze their mistakes and struggles (e.g. grammar tenses, spelling, word ordering). 
Generate a custom, individualized "Summit" practice test of EXACTLY 5 questions designed to target only the areas they struggled with.

You MUST choose from these 4 question formats:
1. Type 'multiple_choice':
   { "id": "q1", "type": "multiple_choice", "question": "Choose the correct verb form: ...", "options": ["A", "B", "C", "D"], "answer": "correct_option" }
2. Type 'fill_in_gap':
   { "id": "q2", "type": "fill_in_gap", "question": "Complete the gap:", "text": "They [are] (be) learning English." }
3. Type 'sentence_unscramble':
   { "id": "q3", "type": "sentence_unscramble", "question": "Put the words in correct order:", "words": ["She", "is", "driving", "the", "car"] }
4. Type 'matching_pairs':
   { "id": "q4", "type": "matching_pairs", "question": "Match the opposites:", "pairs": { "hot": "cold", "big": "small", "up": "down" } }

Return the response as a JSON array of 5 questions.
Do NOT include any markdown commentary, explanation, or tags. Just return a raw, valid JSON array of questions.
`;

    // 4. Call AI completion
    let aiResponse = await generateCompletion(prompt, true);
    
    // Clean up potential markdown formatting block wrapper from response
    if (aiResponse.includes('```json')) {
      aiResponse = aiResponse.split('```json')[1].split('```')[0].trim();
    } else if (aiResponse.includes('```')) {
      aiResponse = aiResponse.split('```')[1].split('```')[0].trim();
    }

    let generatedQuestions;
    try {
      generatedQuestions = JSON.parse(aiResponse.trim());
    } catch (parseError) {
      console.error('Failed to parse AI Summit response:', parseError, aiResponse);
      return NextResponse.json(
        { error: 'AI generated an invalid JSON response structure. Please try again.' },
        { status: 502 }
      );
    }

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'AI returned an empty or invalid question array structure. Please try again.' },
        { status: 502 }
      );
    }

    // 5. Save the generated Summit worksheet per-student (not shared)
    // Delete only this student's previous summit for this category
    db.prepare("DELETE FROM worksheets WHERE category_id = ? AND tier = 'SUMMIT' AND student_id = ?").run(categoryId, studentId);

    const worksheetId = crypto.randomUUID();
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json, student_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(
        worksheetId,
        categoryId,
        `${category.name} - Personalized Summit`,
        'SUMMIT',
        JSON.stringify(generatedQuestions),
        studentId
      );

    return NextResponse.json({ success: true, worksheetId });
  } catch (error: any) {
    console.error('Failed to generate Summit worksheet:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
