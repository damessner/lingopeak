import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { generateCompletion } from '@/lib/aiService';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 AI requests per 1 minute
    const limiter = rateLimit(request, 'ai_generate', 5, 60 * 1000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before generating again.' },
        { status: 429 }
      );
    }

    // Authorize session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, prompt, tier, count, question } = await request.json();

    if (action === 'generate_worksheet') {
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      }

      const qCount = count || 5;
      const qTier = tier || 'EXPLORER';

      const aiPrompt = `
You are a curriculum designer for LingoPeak, a gamified ESL platform.
Generate a JSON array of exactly ${qCount} interactive worksheet questions on the topic/grammar rule: "${prompt}".
The target difficulty tier is: "${qTier}".

Select a diverse, engaging mix of questions from the following 10 supported question types:
1. multiple_choice: Needs "options" (4 choice strings) and "answer" (one of the options).
2. fill_in_gap: Needs "text" string with brackets indicating correct words (e.g. "I [have] (have) two siblings.").
3. sentence_unscramble: Needs "words" array of words in their correct order.
4. matching_pairs: Needs "pairs" object mapping Word A to Word B (e.g. {"Hot": "Cold"}).
5. drag_and_drop: Needs "sentences" array (bracketed gaps e.g. ["Grass is [green]."]) and "distractors" array of incorrect words.
6. category_sorting: Needs "categories" array (e.g. ["Noun", "Verb"]) and "items" array of objects with "text" and "category".
7. correct_the_mistake: Needs "text" (sentence), "mistake" (incorrect word in sentence), and "correction" (correct replacement).
8. choice_matrix: Needs "rows" array of statement rows, "columns" array of category columns, and "answers" object mapping row statement to column category.
9. crossword: Needs "crossword_items" array of objects with "word" (letters only) and "clue" (clue text). Do not generate grid.
10. word_search: Needs "words" array of words (letters only). Do not generate grid.

Return ONLY a valid JSON array of question objects. Do not wrap it in other keys. Do not include markdown \`\`\`json tags.
Each question object MUST contain:
- "id": string (unique like "q_ai_1")
- "type": string (one of the 10 types listed above)
- "question": instruction prompt string (e.g. "Drag the correct words to complete the sentences.")
- all fields matching the selected type.

JSON output structure:
`;

      let response = await generateCompletion(aiPrompt, true);

      // Clean potential markdown blocks
      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0].trim();
      } else if (response.includes('```')) {
        response = response.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(response.trim());
      return NextResponse.json({ questions: parsed });

    } else if (action === 'smart_fill') {
      if (!question || !question.type) {
        return NextResponse.json({ error: 'Question data is required' }, { status: 400 });
      }

      const aiPrompt = `
You are a teaching assistant on LingoPeak. Complete this incomplete question context:
${JSON.stringify(question)}

Identify the question "type" and fill in the missing fields:
- If type is "multiple_choice", generate 4 relevant choices in "options" and set "answer" to the correct option.
- If type is "fill_in_gap", find gaps in the text and bracket them (e.g., "Yesterday I go to market" -> "Yesterday I [went] (go) to the market").
- If type is "drag_and_drop", generate 3 extra incorrect "distractors" (comma-separated in "distractors_raw" and array in "distractors").
- If type is "category_sorting", check the "categories" list, and generate 4-6 matching "items" mapping text to category.
- If type is "correct_the_mistake", find the "mistake" word and supply the correct "correction".
- If type is "choice_matrix", generate rows, columns, and correct "answers" map if empty.
- If type is "crossword", generate clues for each word in "crossword_items".
- If type is "word_search", generate a list of 4-6 uppercase words for the word search list.

Return ONLY a valid JSON object matching the Question shape. Do not wrap it. Do not include markdown \`\`\`json tags.
`;

      let response = await generateCompletion(aiPrompt, true);

      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0].trim();
      } else if (response.includes('```')) {
        response = response.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(response.trim());
      return NextResponse.json({ question: parsed });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Generator Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
