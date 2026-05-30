import db from '@/lib/db';
import { generateCompletion } from '@/lib/aiService';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { studentId, promptId, text } = await request.json();

    if (!studentId || !promptId || !text) {
      return NextResponse.json({ error: 'studentId, promptId and text are required' }, { status: 400 });
    }

    // 1. Fetch prompt details
    const promptRecord = db.prepare('SELECT title, description, rubrics_json FROM writing_prompts WHERE id = ?')
      .get(promptId) as any;

    if (!promptRecord) {
      return NextResponse.json({ error: 'Writing prompt not found' }, { status: 404 });
    }

    const rubrics = JSON.parse(promptRecord.rubrics_json || '[]');

    // 2. Fetch existing student submission
    const submission = db.prepare('SELECT id, draft_version, text, feedback_json, version_history_json, feedback_history_json, completed FROM writing_submissions WHERE student_id = ? AND prompt_id = ?')
      .get(studentId, promptId) as any;

    if (submission && submission.completed === 1) {
      return NextResponse.json({ error: 'This writing assignment is already locked and completed' }, { status: 400 });
    }

    // 3. Formulate the LLM prompt with draft history comparison
    let historyContext = '';
    if (submission) {
      historyContext = `
The student has already submitted Draft ${submission.draft_version} of this writing.
Their previous text was:
"${submission.text}"

Your previous feedback was:
${submission.feedback_json}

Compare the new draft below with their previous draft. Acknowledge any improvements they made based on your previous suggestions!
`;
    }

    const aiPrompt = `
You are a FelloFish-style AI Writing Coach. 
The student is writing in response to the prompt: "${promptRecord.title}"
Prompt Description: "${promptRecord.description}"

Here is the student's submitted writing text:
"${text}"
${historyContext}

Evaluate their writing against the following rubrics:
${JSON.stringify(rubrics, null, 2)}

Provide encouraging, constructive feedback. 
Your goal is to guide the student to improve. Do NOT write the corrected version for them. Instead, point out specific areas of improvement and give hints.

Return your response as a JSON object with this exact structure:
{
  "scores": [
    ${rubrics.map((r: any) => `{ "name": "${r.name}", "score": 3, "max": 5, "comment": "Brief rubric comment" }`).join(',\n    ')}
  ],
  "overall": "General overall encouraging comment...",
  "inline_feedback": [
    {
      "text_segment": "the exact string snippet from the student's text to highlight",
      "hint": "a leading hint or correction clue without revealing the exact solution"
    }
  ]
}

CRITICAL RULES for inline_feedback:
- "text_segment" MUST match a literal, case-sensitive substring of the student's submitted text exactly.
- "hint" should explain the issue (e.g. grammar error, tense discrepancy, spelling mistake, word repetition) and ask a guiding question to lead them to fix it.
- Keep "inline_feedback" items focused (at most 5-6 key highlights so the student is not overwhelmed).

Only return valid JSON. Do not include any markdown format tags like \`\`\`json or annotations. Just return the JSON object directly.
`;

    // 4. Generate feedback from AI
    let aiResponse = await generateCompletion(aiPrompt, true);

    // Clean potential markdown blocks
    if (aiResponse.includes('```json')) {
      aiResponse = aiResponse.split('```json')[1].split('```')[0].trim();
    } else if (aiResponse.includes('```')) {
      aiResponse = aiResponse.split('```')[1].split('```')[0].trim();
    }

    // Verify valid JSON
    const parsedFeedback = JSON.parse(aiResponse.trim());

    // 5. Update SQLite submission records
    let resultSubmission: any = null;

    db.transaction(() => {
      if (!submission) {
        // First submission (Draft 1)
        const id = crypto.randomUUID();
        db.prepare(`
          INSERT INTO writing_submissions (
            id, student_id, prompt_id, draft_version, text, feedback_json, 
            version_history_json, feedback_history_json, completed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(
          id,
          studentId,
          promptId,
          1,
          text,
          JSON.stringify(parsedFeedback),
          JSON.stringify([]),
          JSON.stringify([])
        );

        resultSubmission = {
          id,
          draft_version: 1,
          text,
          feedback_json: JSON.stringify(parsedFeedback),
          version_history_json: JSON.stringify([]),
          feedback_history_json: JSON.stringify([]),
          completed: 0
        };
      } else {
        // Revision submission (Draft N)
        const newVersion = submission.draft_version + 1;
        const pastTexts = JSON.parse(submission.version_history_json || '[]');
        const pastFeedbacks = JSON.parse(submission.feedback_history_json || '[]');

        pastTexts.push(submission.text);
        pastFeedbacks.push(submission.feedback_json);

        db.prepare(`
          UPDATE writing_submissions 
          SET draft_version = ?, text = ?, feedback_json = ?, version_history_json = ?, feedback_history_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          newVersion,
          text,
          JSON.stringify(parsedFeedback),
          JSON.stringify(pastTexts),
          JSON.stringify(pastFeedbacks),
          submission.id
        );

        resultSubmission = {
          id: submission.id,
          draft_version: newVersion,
          text,
          feedback_json: JSON.stringify(parsedFeedback),
          version_history_json: JSON.stringify(pastTexts),
          feedback_history_json: JSON.stringify(pastFeedbacks),
          completed: 0
        };
      }
    })();

    return NextResponse.json(resultSubmission);
  } catch (error: any) {
    console.error('AI Writing Coach Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
