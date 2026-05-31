/**
 * hermesMemory.ts
 * 
 * Persistent per-student memory for the Hermes tutor.
 * Stores key/value facts (e.g. learning_goal, weak_areas, last_topic) in the
 * student_memories table. All operations are synchronous (better-sqlite3).
 */

import db from '@/lib/db';

export interface MemoryEntry {
  key: string;
  value: string;
  updated_at: string;
}

// ─── Readers ──────────────────────────────────────────────────────────────────

export function getMemory(studentId: string): Record<string, string> {
  try {
    const rows = db
      .prepare('SELECT key, value FROM student_memories WHERE student_id = ?')
      .all(studentId) as MemoryEntry[];
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  } catch {
    return {};
  }
}

export function getMemoryValue(studentId: string, key: string): string | null {
  try {
    const row = db
      .prepare('SELECT value FROM student_memories WHERE student_id = ? AND key = ?')
      .get(studentId, key) as { value: string } | undefined;
    return row?.value ?? null;
  } catch {
    return null;
  }
}

// ─── Writers ──────────────────────────────────────────────────────────────────

export function setMemory(studentId: string, key: string, value: string): void {
  db.prepare(`
    INSERT INTO student_memories (student_id, key, value, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(studentId, key, value);
}

export function setMemoryBulk(studentId: string, entries: Record<string, string>): void {
  const upsert = db.prepare(`
    INSERT INTO student_memories (student_id, key, value, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  const runAll = db.transaction((map: Record<string, string>) => {
    for (const [k, v] of Object.entries(map)) {
      upsert.run(studentId, k, v);
    }
  });
  runAll(entries);
}

export function deleteMemory(studentId: string, key: string): void {
  db.prepare('DELETE FROM student_memories WHERE student_id = ? AND key = ?').run(studentId, key);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Returns a compact markdown block to inject into the Hermes system prompt.
 */
export function formatMemoryForPrompt(memory: Record<string, string>): string {
  const entries = Object.entries(memory);
  if (entries.length === 0) return '';
  const lines = entries.map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n');
  return `\n\n## What Hermes Remembers About This Student\n${lines}\nUse this context to personalize guidance. Update these facts if the student reveals new information during the conversation.`;
}

/**
 * Parses an AI response for MEMORY_UPDATE JSON blocks and persists them.
 * Format: <!--MEMORY_UPDATE:{"key":"value"}-->
 */
export function parseAndPersistMemoryUpdates(studentId: string, text: string): string {
  const pattern = /<!--MEMORY_UPDATE:(.*?)-->/g;
  let match: RegExpExecArray | null;
  const updates: Record<string, string> = {};

  while ((match = pattern.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      Object.assign(updates, parsed);
    } catch {
      // ignore malformed blocks
    }
  }

  if (Object.keys(updates).length > 0) {
    setMemoryBulk(studentId, updates);
  }

  // Strip the memory-update tags from the reply shown to the student
  return text.replace(pattern, '').trim();
}

export interface StudentGoal {
  key: string;
  text: string;
  created: string;
  status: 'active' | 'completed';
}

export function getGoals(studentId: string): StudentGoal[] {
  try {
    const rows = db
      .prepare("SELECT key, value FROM student_memories WHERE student_id = ? AND key LIKE 'goal_%'")
      .all(studentId) as Array<{ key: string; value: string }>;
    return rows.map(r => {
      try {
        const parsed = JSON.parse(r.value);
        return { key: r.key, ...parsed } as StudentGoal;
      } catch {
        return {
          key: r.key,
          text: r.value,
          created: new Date().toISOString().split('T')[0],
          status: 'active'
        } as StudentGoal;
      }
    });
  } catch {
    return [];
  }
}

export function formatGoalsForPrompt(goals: StudentGoal[]): string {
  const activeGoals = goals.filter(g => g.status === 'active');
  if (activeGoals.length === 0) return '';
  const lines = activeGoals.map(g => `- ${g.text} (set ${g.created})`).join('\n');
  return `\n\n## Active Learning Goals\n${lines}\nReference these when relevant and encourage the student to make progress toward them.`;
}
