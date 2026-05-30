import db from '@/lib/db';
import { generateCompletion } from '@/lib/aiService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    // 1. Fetch class name
    const classRecord = db.prepare('SELECT name FROM classes WHERE id = ?').get(classId) as any;
    if (!classRecord) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // 2. Fetch struggled attempts in this class (score < 80)
    const attempts = db.prepare(`
      SELECT a.score, a.answers_json, w.title as worksheet_title, w.questions_json, cat.name as category_name, u.username
      FROM attempts a
      JOIN users u ON a.student_id = u.id
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories cat ON w.category_id = cat.id
      WHERE u.class_id = ? AND a.score < 80
      ORDER BY a.completed_at DESC
      LIMIT 30
    `).all(classId) as any[];

    if (attempts.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: `### Class Revision Report for Class ${classRecord.name}

Great news! No significant struggles (scores below 80%) were logged for this class recently.
Keep up the good work! Feel free to assign new chapters or worksheets.`
      });
    }

    // 3. Compile struggles context for AI
    const strugglesList = attempts.map((att) => {
      let wrongQs = [];
      try {
        const questions = JSON.parse(att.questions_json);
        const answers = JSON.parse(att.answers_json);

        // Find which questions are incorrect
        // For multiple_choice, check if answers[q.id] !== q.answer
        // For fill_in_gap, check if answers[q.id] !== q.answer (or similar)
        for (const q of questions) {
          const studentAns = answers[q.id];
          let isCorrect = false;

          if (q.type === 'multiple_choice') {
            isCorrect = studentAns === q.answer;
          } else if (q.type === 'fill_in_gap') {
            isCorrect = studentAns === q.answer;
          } else {
            // Assume incorrect for other types for simplicity or check if score is low
            isCorrect = att.score > 80;
          }

          if (!isCorrect) {
            wrongQs.push({
              question: q.question || q.text || 'Question text',
              correctAnswer: q.answer || 'Refer to text',
              studentAnswer: studentAns || 'Skipped/Incorrect'
            });
          }
        }
      } catch (e) {
        // Fallback if parsing fails
      }

      return {
        student: att.username,
        worksheet: att.worksheet_title,
        category: att.category_name,
        score: att.score,
        failures: wrongQs
      };
    });

    const aiPrompt = `
You are an expert ESL (English as a Second Language) pedagogical analyst.
You are generating a Class Revision & Lesson Plan for Class "${classRecord.name}" based on recent student worksheet errors.

Here is a summary of students who scored below 80% on worksheets and the questions they failed:
${JSON.stringify(strugglesList, null, 2)}

Provide a detailed review plan formatted in clean Markdown. Your response should contain:
1. **Struggle Analysis**: Identify the key grammatical rules, spelling errors, or vocabulary concepts that the class as a whole is struggling with (based on the wrong answers).
2. **Review Lesson Plan (30 mins)**:
   - **Warmup (5 mins)**: Fun interactive board game/concept recap.
   - **Core Instruction (15 mins)**: Clear board explanation of the struggled rules (e.g. Present Continuous structure).
   - **Guided Practice (10 mins)**: Collaborative class activities.
3. **Class Review Exercises**: 3 newly generated practice questions (with correct answers clearly marked) targeting these specific mistakes, which the teacher can write on the blackboard.

Keep the tone professional and directly actionable for a high school teacher. Return ONLY the Markdown text. Do not wrap in extra commentary outside the Markdown.
`;

    // 4. Call AI completion
    const aiResponse = await generateCompletion(aiPrompt, false);

    return NextResponse.json({ success: true, analysis: aiResponse });
  } catch (error: any) {
    console.error('Class Revision Generator Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
