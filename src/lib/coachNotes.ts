import db from './db';
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

export function getActiveNotes(studentId: string, limit = 10, forPrompt = false): CoachNote[] {
  try {
    const query = forPrompt
      ? `SELECT * FROM coach_notes
         WHERE student_id = ? AND is_active = 1 AND source != 'teacher'
         ORDER BY
           CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
           created_at DESC
         LIMIT ?`
      : `SELECT * FROM coach_notes
         WHERE student_id = ? AND is_active = 1
         ORDER BY
           CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
           created_at DESC
         LIMIT ?`;
    return db.prepare(query).all(studentId, limit) as CoachNote[];
  } catch (err) {
    console.error('Failed to get active notes:', err);
    return [];
  }
}

export function getNotesByCategory(studentId: string, category: string, limit = 5): CoachNote[] {
  try {
    return db.prepare(`
      SELECT * FROM coach_notes
      WHERE student_id = ? AND category = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT ?
    `).all(studentId, category.toLowerCase(), limit) as CoachNote[];
  } catch (err) {
    console.error('Failed to get notes by category:', err);
    return [];
  }
}

export function getRecentHighPriorityNotes(studentId: string, days = 3): CoachNote[] {
  try {
    return db.prepare(`
      SELECT * FROM coach_notes
      WHERE student_id = ? AND priority = 'high' AND is_active = 1
        AND created_at >= datetime('now', ?)
      ORDER BY created_at DESC
    `).all(studentId, `-${days} days`) as CoachNote[];
  } catch (err) {
    console.error('Failed to get recent high priority notes:', err);
    return [];
  }
}

// ─── Archive ──────────────────────────────────────────────────────

export function archiveNote(noteId: string): void {
  db.prepare('UPDATE coach_notes SET is_active = 0 WHERE id = ?').run(noteId);
}

export function archiveAllActiveNotes(studentId: string): void {
  db.prepare('UPDATE coach_notes SET is_active = 0 WHERE student_id = ? AND is_active = 1').run(studentId);
}

export function archiveOldNotes(studentId: string, days = 14): void {
  db.prepare(`
    UPDATE coach_notes
    SET is_active = 0
    WHERE student_id = ? AND is_active = 1 AND priority != 'high'
      AND created_at < datetime('now', ?)
  `).run(studentId, `-${days} days`);
}

export function archiveAndKeepRecentHigh(studentId: string): void {
  const recentHigh = getRecentHighPriorityNotes(studentId, 7);
  archiveAllActiveNotes(studentId);
  for (const note of recentHigh) {
    db.prepare('UPDATE coach_notes SET is_active = 1 WHERE id = ?').run(note.id);
  }
}

// ─── Format for Prompt Injection ──────────────────────────────────

export function formatNotesForPrompt(notes: CoachNote[]): string {
  if (notes.length === 0) return '';
  const lines = notes.map(n =>
    `- [${n.priority.toUpperCase()}] ${n.category}: ${n.content}`
  );
  return `\n\n## Recent Coach Notes About This Student\n${lines.join('\n')}\nUse these narrative notes to personalize your guidance, review patterns, and address these feedback areas.`;
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
    } catch (e) {
      console.warn('Failed to parse and persist coach note tag:', e);
      // ignore malformed tags
    }
  }
  return text.replace(pattern, '').trim();
}
