# Coach Upgrade: Socratic Learning Coach 2.0

**Status**: Draft for review
**Audience**: Another AI (or yourself) that will critically review, improve, and implement this plan.

---

## Overview

The Coach is currently a capable Socratic tutor with persistent key/value memory, spaced repetition cron, and a worksheet help drawer. This plan upgrades it from a **reactive chat widget** to an **autonomous learning companion** that:

- Writes and recalls narrative observations about each student
- Tracks progress toward personal goals
- Detects when to escalate to a human teacher
- Adapts question types to each student's learning style
- Summarizes progress weekly for both students and teachers

---

## Phase 0: Quick Fixes (Pre-requisites)

### 0.1 — Scaffolding Level in Help Route

**File**: `src/app/api/student/worksheet/help/route.ts`

**Current**: The help route builds a Socratic prompt but doesn't read the student's scaffolding level from `student_memories`. A student who needs MAXIMUM support gets the same hint style as MINIMAL.

**Change**:

1. After line 45 (after `formatMemoryForPrompt`), query the scaffolding level:
   ```ts
   const scafRow = db.prepare(
     "SELECT value FROM student_memories WHERE student_id = ? AND key = 'scaffolding_level'"
   ).get(session.userId) as { value: string } | undefined;
   const scafLevel = scafRow?.value ?? 'MODERATE';
   ```

2. Build a scaffolding instruction string:
   ```ts
   const scafInstruction = scafLevel === 'MAXIMUM'
     ? '\n- This student needs MAXIMUM scaffolding. Break down every step. Give very short, simple hints.'
     : scafLevel === 'MINIMAL'
       ? '\n- This student needs MINIMAL scaffolding. Give light nudges and push for precision.'
       : '\n- This student needs MODERATE scaffolding. Guide them and confirm understanding.';
   ```

3. Append `scafInstruction` to the system prompt at line 61.

**Validation**: Send a request from a student with avg <60% — response should use simpler language and more step-by-step guidance. Send from a student with avg >80% — response should be brief and push for self-correction.

---

### 0.2 — Dynamic Question Types in Practice Generator

**Files**:
- `src/app/api/student/tutor/message/route.ts` (tag-based generator, line ~156)
- `src/app/api/student/tutor/generate-practice/route.ts` (manual generator, line ~40)

**Current**: Both generators hardcode `'multiple_choice'` as the question type. The system prompt mentions valid categories (`GRAMMAR`, `VOCABULARY`, etc.) but the generator ignores the category when building questions.

**Change** (apply to both files identically):

1. Define a type map:
   ```ts
   const TYPE_BY_CATEGORY: Record<string, string> = {
     GRAMMAR: 'multiple_choice',
     VOCABULARY: 'drag_and_drop',
     READING: 'matching_pairs',
     WRITING: 'fill_in_gap',
     LISTENING: 'multiple_choice',
   };
   ```

2. Update the AI prompt to use the mapped type:
   ```ts
   const qType = TYPE_BY_CATEGORY[(category || '').toUpperCase()] ?? 'multiple_choice';
   ```

3. Expand the AI prompt instruction to include type-specific rules:
   ```ts
   `Generate exactly ${cappedCount} ${qType} questions about the topic: "${topic.trim()}"
    Rules for question type "${qType}":
    - multiple_choice: 4 options, one correct
    - drag_and_drop: provide 4+ draggable words + 3 sentences with [brackets] for gaps
    - matching_pairs: 4 pairs of terms → definitions
    - fill_in_gap: 3-4 sentences with ___ gaps, provide word bank
    ...`
   ```

**Validation**: Generate practice for `VOCABULARY` → output should be `drag_and_drop` questions. Generate for `GRAMMAR` → output should be `multiple_choice`.

---

## Phase 1: Coach Notes System (Foundation)

### 1.1 — New Database Table

**File**: `src/lib/schema.sql` (add after line 180)

```sql
-- Coach narrative observations about students
CREATE TABLE IF NOT EXISTS coach_notes (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',  -- grammar, vocabulary, confidence, engagement, general
  content TEXT NOT NULL,                       -- free-form observation, 1-3 sentences
  priority TEXT NOT NULL DEFAULT 'normal',     -- low, normal, high
  source TEXT NOT NULL DEFAULT 'ai',           -- 'ai', 'teacher', 'cron'
  is_active INTEGER DEFAULT 1,                -- 1 = current, 0 = archived
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coach_notes_student ON coach_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_active ON coach_notes(student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coach_notes_category ON coach_notes(student_id, category, is_active);
```

### 1.2 — DB Migration

**File**: `src/lib/db.ts` (add to the migration section)

```ts
try {
  db.prepare("SELECT id FROM coach_notes LIMIT 1").get();
} catch {
  console.log('Migrating: Creating coach_notes table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS coach_notes (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      content TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      source TEXT NOT NULL DEFAULT 'ai',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_coach_notes_student ON coach_notes(student_id);
    CREATE INDEX IF NOT EXISTS idx_coach_notes_active ON coach_notes(student_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_coach_notes_category ON coach_notes(student_id, category, is_active);
  `);
}
```

### 1.3 — Coach Notes Library

**File**: `src/lib/coachNotes.ts` (new)

```ts
import db from '@/lib/db';
import crypto from 'crypto';

export interface CoachNote {
  id: string;
  student_id: string;
  category: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  source: 'ai' | 'teacher' | 'cron';
  is_active: number;
  created_at: string;
}

// ─── Write ────────────────────────────────────────────────────────

export function addCoachNote(
  studentId: string,
  category: string,
  content: string,
  priority: 'low' | 'normal' | 'high' = 'normal',
  source: 'ai' | 'teacher' | 'cron' = 'ai'
): string {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO coach_notes (id, student_id, category, content, priority, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, studentId, category.toLowerCase(), content.trim(), priority, source);
  return id;
}

// ─── Read ─────────────────────────────────────────────────────────

export function getActiveNotes(studentId: string, limit = 10): CoachNote[] {
  return db.prepare(`
    SELECT * FROM coach_notes
    WHERE student_id = ? AND is_active = 1
    ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT ?
  `).all(studentId, limit) as CoachNote[];
}

export function getNotesByCategory(studentId: string, category: string, limit = 5): CoachNote[] {
  return db.prepare(`
    SELECT * FROM coach_notes
    WHERE student_id = ? AND category = ? AND is_active = 1
    ORDER BY created_at DESC
    LIMIT ?
  `).all(studentId, category.toLowerCase(), limit) as CoachNote[];
}

export function getRecentHighPriorityNotes(studentId: string, days = 3): CoachNote[] {
  return db.prepare(`
    SELECT * FROM coach_notes
    WHERE student_id = ? AND priority = 'high' AND is_active = 1
      AND created_at >= datetime('now', ?)
    ORDER BY created_at DESC
  `).all(studentId, `-${days} days`) as CoachNote[];
}

// ─── Archive ──────────────────────────────────────────────────────

export function archiveNote(noteId: string): void {
  db.prepare('UPDATE coach_notes SET is_active = 0 WHERE id = ?').run(noteId);
}

export function archiveAllActiveNotes(studentId: string): void {
  db.prepare('UPDATE coach_notes SET is_active = 0 WHERE student_id = ? AND is_active = 1').run(studentId);
}

// ─── Format for Prompt Injection ──────────────────────────────────

export function formatNotesForPrompt(notes: CoachNote[]): string {
  if (notes.length === 0) return '';
  const lines = notes.map(n =>
    `- [${n.priority.toUpperCase()}] ${n.category}: ${n.content}`
  );
  return `\n\n## Recent Coach Notes About This Student\n${lines.join('\n')}`;
}

// ─── Tag Parsing ──────────────────────────────────────────────────

/**
 * Parses <!--COACH_NOTE:{...}--> tags from AI response,
 * persists them, and returns the stripped text.
 */
export function parseAndPersistCoachNotes(studentId: string, text: string): string {
  const pattern = /<!--COACH_NOTE:(.*?)-->/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      addCoachNote(
        studentId,
        data.category || 'general',
        data.content || '',
        data.priority || 'normal',
        'ai'
      );
    } catch {
      // ignore malformed tags
    }
  }
  return text.replace(pattern, '').trim();
}
```

### 1.4 — Wire Notes into Message Route

**File**: `src/app/api/student/tutor/message/route.ts`

Imports to add:
```ts
import {
  getActiveNotes,
  formatNotesForPrompt,
  parseAndPersistCoachNotes,
} from '@/lib/coachNotes';
```

After loading memory (line ~49), add:
```ts
const notes = getActiveNotes(session.userId);
const notesBlock = formatNotesForPrompt(notes);
```

After `parseAndPersistMemoryUpdates` (line ~142), add:
```ts
cleanReply = parseAndPersistCoachNotes(session.userId, cleanReply);
```

Append `notesBlock` to the system prompt (line ~129).

### 1.5 — Wire Notes into Help Route

**File**: `src/app/api/student/worksheet/help/route.ts`

Same pattern: load notes, inject into prompt. Gives the worksheet assistant access to the same student observations.

### 1.6 — Teacher API for Notes

**File**: `src/app/api/teacher/coach/notes/route.ts` (new)

```ts
GET  /api/teacher/coach/notes?studentId=X → returns active notes for that student
POST /api/teacher/coach/notes → body: { studentId, category, content, priority }
       Teachers can manually write observations (source='teacher')
DELETE /api/teacher/coach/notes?id=X → archive a single note
```

---

## Phase 2: Autonomous Upgrades

### 2.1 — Teacher Handover on Persistent Struggles

**File**: `src/app/api/student/tutor/message/route.ts`

After the AI reply is saved, add a check:

```ts
// Count how many times this student has struggled with this category recently
const recentFails = db.prepare(`
  SELECT COUNT(*) as count FROM attempts a
  JOIN worksheets w ON a.worksheet_id = w.id
  JOIN categories c ON w.category_id = c.id
  WHERE a.student_id = ? AND a.score < 60
    AND a.completed_at >= datetime('now', '-14 days')
`).get(session.userId) as { count: number };

// If a student fails the same category 3+ times, write a high-priority note + notify teacher
if (recentFails.count >= 3) {
  addCoachNote(session.userId, 'grammar',
    `Student has failed ${recentFails.count} worksheets in the past 14 days. May need targeted intervention.`,
    'high', 'ai');

  // Also push a teacher notification
  createNotification(session.userId,
    '⚠️ Student Needs Help',
    `Coach has flagged ${session.username} for persistent struggles (${recentFails.count} failed worksheets in 2 weeks).`);
}
```

**File**: `src/lib/notifications.ts` — verify `createNotification` supports teacher-directed notifications (or extend it).

### 2.2 — Goals Tracking

**No new table needed**. Use `student_memories` with conventions:

| Key | Value | Example |
|-----|-------|---------|
| `goal_1` | `{"text":"improve past tense","created":"2026-06-01","status":"active"}` | Parsed when loading into prompt |
| `goal_2` | `{"text":"learn 50 new words","created":"2026-06-05","status":"active"}` | |

**Prompt injection** — Read all `goal_*` keys and format:

```
## Active Learning Goals
- Improve past tense (set Jun 1) — still active
- Learn 50 new words (set Jun 5) — still active
Reference these when relevant.
```

**Completing a goal** — When a goal is no longer relevant, Coach emits:
```
<!--MEMORY_UPDATE:{"goal_1_update":"{\"text\":\"improve past tense\",\"created\":\"2026-06-01\",\"completed\":\"2026-06-10\",\"status\":\"completed\"}"}-->
```

Then add a celebration in the prompt and inject the goal status.

**Implementation**:
- Extend `hermesMemory.ts` with `getGoals()`, `formatGoalsForPrompt()`
- Add parsing for goal completion in `parseAndPersistMemoryUpdates()`
- Add COACH_NOTE auto-generation when a goal is completed: `"${student.username} completed their goal: ${goal.text}"`

### 2.3 — Confidence Detection

**Prompt change only** — no new code. Add to the system prompt in `message/route.ts`:

```
When a student shows signs of uncertainty (e.g. "I think...", "maybe...", 
"um", excessive hedging, or repeatedly second-guessing themselves):
- Reassure them first: "You're on the right track!"
- Offer a small hint or simplification without them asking
- Consider temporarily lowering scaffolding level for this exchange
```

After the reply, optionally check for confidence-related patterns and write a note:

```ts
// In message/route.ts, after getting the AI reply
const lowConfidencePatterns = /\bI think\b|\bmaybe\b|\bnot sure\b|\bum\b|\buh\b/i;
if (lowConfidencePatterns.test(message)) {
  // Only write a note once per day per student
  const recentNote = db.prepare(`
    SELECT id FROM coach_notes
    WHERE student_id = ? AND category = 'confidence'
      AND created_at >= datetime('now', '-1 day')
  `).get(session.userId);
  if (!recentNote) {
    addCoachNote(session.userId, 'confidence',
      'Student showed signs of low confidence in today\'s session (hedging, self-doubt). Consider reassurance-focused scaffolding.',
      'normal', 'ai');
  }
}
```

### 2.4 — Weekly Student Recap

**File**: `scripts/cron-coach.ts` — add a new mode: `npx tsx scripts/cron-coach.ts weekly-recap`

Logic:

```ts
async function runWeeklyRecap(): Promise<void> {
  const activeStudents = db.prepare(`
    SELECT DISTINCT student_id FROM tutor_messages
    WHERE role = 'user'
      AND created_at >= datetime('now', '-7 days')
  `).all() as { student_id: string }[];

  for (const { student_id } of activeStudents) {
    // Count interactions and score trend
    const stats = db.prepare(`
      SELECT
        COUNT(*) as interactions,
        ROUND(AVG(a.score), 1) as avg_score
      FROM tutor_messages t
      LEFT JOIN attempts a ON a.student_id = t.student_id
        AND a.completed_at >= datetime('now', '-7 days')
      WHERE t.student_id = ? AND t.role = 'user'
        AND t.created_at >= datetime('now', '-7 days')
    `).get(student_id) as { interactions: number; avg_score: number | null };

    if (!stats || stats.interactions < 3) continue;

    const prompt = `Write a short, encouraging weekly recap (2-3 sentences) for an ESL student.
They had ${stats.interactions} Coach conversations this week.
${stats.avg_score ? `Their worksheet average was ${Math.round(stats.avg_score)}%.` : 'No worksheet data this week.'}
Highlight progress, mention one area to focus on next week, and keep the tone warm.
Do not mention specific scores or statistics.`;

    const recap = await callAI(prompt);
    if (!recap.trim()) continue;

    // Save as assistant message so it appears in their chat
    db.prepare(`
      INSERT INTO tutor_messages (id, student_id, role, content, origin, created_at)
      VALUES (?, ?, 'assistant', ?, 'cron', CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), student_id, recap.trim());
  }
}
```

Add to the entry point (line ~311):
```ts
const mode = process.argv[2] ?? 'daily';
if (mode === 'weekly-recap') runWeeklyRecap().catch(console.error);
```

### 2.5 — Session Summary Memory

**Prompt change** in `message/route.ts`. After every 5th exchange in a session, inject:

```
Before ending this part of the conversation, write a brief <!--COACH_NOTE:...--> 
summarizing what was discussed, what the student struggled with, 
and what to focus on next time.
```

Implement as a **modulo check** on message count:

```ts
// Count messages in this session
const sessionCount = history.length + 1; // +1 for current message
if (sessionCount % 5 === 0) {
  systemPrompt += `\nThis is exchange #${sessionCount} in this session. If it feels like a natural break point, write a brief <!--COACH_NOTE:{"category":"session_summary","content":"..."}--> tag summarizing what was covered.`;
}
```

This keeps summaries sparse (every 5 messages, not every turn) and lets the AI decide when it's appropriate.

---

## Phase 3: Teacher Dashboard Integration

### 3.1 — Notes Viewer in Teacher Dashboard

**File**: `src/app/teacher/dashboard/TeacherDashboardClient.tsx`

Add a new tab or extend the existing pupil detail view:

- When a teacher clicks a student name → show their active `coach_notes`
- Color-code by priority: red for `high`, yellow for `normal`, grey for `low`
- Teachers can add manual notes via a simple form (POST to `/api/teacher/coach/notes`)
- Teachers can dismiss/archive notes when action has been taken

### 3.2 — Struggle Flag on Dashboard

The pupil list already shows students. Add a visual indicator:

```
🔴 Tom (3 coach notes — 1 high priority)  [View Notes]
🟡 Anna (2 coach notes)
```

This uses a simple query:
```sql
SELECT student_id, COUNT(*) as count,
  SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_count
FROM coach_notes WHERE is_active = 1
GROUP BY student_id
```

---

## Implementation Order

| Order | Phase | Item | Dependencies | Effort |
|-------|-------|------|-------------|--------|
| 1 | 0.1 | Scaffolding in help route | None | 20 min |
| 2 | 0.2 | Dynamic question types | None | 30 min |
| 3 | 1.1–1.3 | Coach Notes table + library | None | 2 hr |
| 4 | 1.4–1.5 | Wire notes into message + help routes | 1.1–1.3 | 1 hr |
| 5 | 2.1 | Teacher handover on persistent struggles | 1.4 | 1 hr |
| 6 | 1.6 | Teacher API for notes | 1.1–1.3 | 1 hr |
| 7 | 3.1–3.2 | Teacher dashboard notes viewer | 1.6 | 2 hr |
| 8 | 2.2 | Goals tracking | 1.4 (reuses memory system) | 1 hr |
| 9 | 2.3 | Confidence detection | 1.4 (needs note writing) | 1 hr |
| 10 | 2.4 | Weekly student recap | 2.1 (extends cron) | 1 hr |
| 11 | 2.5 | Session summary memory | 1.4 (prompt + note writing) | 1 hr |

**Total**: ~9-10 hours for full implementation.

Items 1-5 (Phase 0 + core notes system) get you 80% of the value in ~5 hours.

---

## Edge Cases & Risks for Critical Review

| Risk | Mitigation |
|------|-----------|
| **Note bloat** — Coach writes too many notes, prompt gets too long | `getActiveNotes()` limits to 10. `archiveAllActiveNotes()` clears old ones. Add a daily cron summarizer that condenses 10+ notes into 2-3 takeaways. |
| **Teacher notes vs AI notes** — Teachers may override AI with their own | Use `source` column. AI notes are suggestions; teacher notes are authoritative. When both exist, teacher notes are injected first. |
| **Goal completion false positive** — AI marks a goal complete prematurely | Only the student should confirm completion via chat ("I think I've got it now"). AI suggests, student confirms. |
| **Confidence detection false positive** — Student uses "I think" in normal speech as a discourse marker | Only flag when combined with other signals: hedging + multiple corrections + long response time. Start simple, refine later. |
| **Help route stays stateless** — Worksheet help doesn't persist conversations | The `help/route.ts` currently doesn't save to `tutor_messages`. After implementing coach notes, also save worksheet help interactions as `source='worksheet_help'` messages so the main Coach has context. |
| **Cron-coach notes don't get injected** — The cron daemon uses raw SQLite, not the Next.js routes | The daemon in `scripts/cron-coach.ts` connects to the same DB. It can call `addCoachNote()` directly if `coachNotes.ts` is refactored to not import from `@/lib/db` (which won't work in a standalone TSX script). **Fix**: Move `coachNotes.ts` functions to not depend on Next.js path aliases, or duplicate the INSERT logic in the cron script. |

---

## Verification

For each phase, run these checks:

```bash
# 1. Build
npm run build

# 2. Tests
npm run test

# 3. Manual verification
# - Open /student/tutor as a student with low scores → check scaffolding level
# - Click "Ask Coach" on a worksheet → check scaffolding matches
# - Say "I want to improve past tense" → check MEMORY_UPDATE creates a goal
# - Check coach_notes table has entries after a few chat exchanges
# - Teacher dashboard shows student with high-priority notes
```
