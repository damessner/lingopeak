import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { generateCompletion } from '@/lib/aiService';
import db from '@/lib/db';
import { getMemory, formatMemoryForPrompt } from '@/lib/hermesMemory';
import { getActiveNotes, formatNotesForPrompt } from '@/lib/coachNotes';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { worksheetId, questionIndex, studentMessage, history = [] } = await req.json() as {
      worksheetId: string;
      questionIndex: number;
      studentMessage: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!worksheetId || questionIndex === undefined || !studentMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch worksheet and parse questions
    const worksheet = db.prepare('SELECT title, questions_json FROM worksheets WHERE id = ?')
      .get(worksheetId) as { title: string; questions_json: string } | undefined;

    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
    }

    const questions = JSON.parse(worksheet.questions_json) as any[];
    const question = questions[questionIndex];
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // 2. Fetch student memory context
    const memory = getMemory(session.userId);
    const memoryBlock = formatMemoryForPrompt(memory);

    // Fetch scaffolding level
    const scafRow = db.prepare(
      "SELECT value FROM student_memories WHERE student_id = ? AND key = 'scaffolding_level'"
    ).get(session.userId) as { value: string } | undefined;
    const scafLevel = scafRow?.value ?? 'MODERATE';

    const scafInstruction = scafLevel === 'MAXIMUM'
      ? '\n- This student needs MAXIMUM scaffolding. Break down every step. Give very short, simple, easy-to-understand hints.'
      : scafLevel === 'MINIMAL'
        ? '\n- This student needs MINIMAL scaffolding. Give light, indirect nudges and push for precision.'
        : '\n- This student needs MODERATE scaffolding. Guide them and confirm understanding at each step.';

    // Fetch Coach narrative notes
    const notes = getActiveNotes(session.userId, 10, true);
    const notesBlock = formatNotesForPrompt(notes);

    // 3. Construct prompt
    const systemPrompt = `You are Coach, a friendly and supportive Socratic AI learning assistant on LingoPeak.
The student is currently working on the worksheet "${worksheet.title}".
They are asking for help on question ${questionIndex + 1}:
Question Type: ${question.type}
Question prompt/content: "${question.question || question.text || ''}"
${question.options ? `Multiple choice options: ${JSON.stringify(question.options)}` : ''}

CRITICAL RULE:
You NEVER give the student the correct answer. You must help them figure it out themselves.
Guidelines:
- Reference the question type and guide them through the reasoning without revealing the answer.
- Give extremely short hints (1-2 sentences) matching their scaffolding level.${scafInstruction}
- If they are completely wrong or stuck, give them a hint about the rule or pattern, never the word or answer.
- Keep your tone warm, encouraging, and Socratic.${notesBlock}${memoryBlock}`;

    const formattedHistory = history
      .map(m => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.content}`)
      .join('\n');

    const promptText = `${systemPrompt}\n\n${formattedHistory}\nStudent: ${studentMessage.trim()}\nCoach:`;

    const rawReply = await generateCompletion(promptText, false);

    return NextResponse.json({
      success: true,
      reply: rawReply.trim()
    });
  } catch (err: any) {
    console.error('Worksheet help error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
