/**
 * Typed database query wrapper for better-sqlite3.
 *
 * Usage:
 *   import { query, queryOne } from '@/lib/db-typed';
 *   const students = query<Student>(db, 'SELECT * FROM students WHERE class_id = ?', classId);
 *
 * This replaces `as any[]` / `as any` casts throughout the codebase.
 */

import db, { type default as Database } from '@/lib/db';
import type BetterSqlite3 from 'better-sqlite3';

/**
 * Execute a SELECT query and return all rows typed as T[].
 */
export function query<T>(sql: string, ...params: unknown[]): T[] {
  const stmt = (db as unknown as BetterSqlite3.Database).prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Execute a SELECT query and return a single row typed as T | undefined.
 */
export function queryOne<T>(sql: string, ...params: unknown[]): T | undefined {
  const stmt = (db as unknown as BetterSqlite3.Database).prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * Execute a mutation (INSERT/UPDATE/DELETE) and return the result.
 */
export function run(sql: string, ...params: unknown[]): BetterSqlite3.RunResult {
  const stmt = (db as unknown as BetterSqlite3.Database).prepare(sql);
  return stmt.run(...params);
}

// ── Common result types ──

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  password_salt: string | null;
  role: string;
  avatar_emoji: string;
  class_id: string | null;
  teams_webhook_url: string | null;
  created_at: string;
}

export interface WorksheetRow {
  id: string;
  category_id: string | null;
  title: string;
  tier: string;
  questions_json: string;
  badge_emoji: string;
  audio_url: string | null;
  image_url: string | null;
  video_url: string | null;
  transcript: string | null;
  is_dialogue: number;
  student_id: string | null;
  created_at: string;
}

export interface AttemptRow {
  id: string;
  student_id: string;
  worksheet_id: string;
  score: number;
  answers_json: string;
  completed_at: string;
}

export interface UnitRow {
  id: string;
  title: string;
  order_num: number;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  unit_id: string;
  created_at: string;
}

export interface ClassRow {
  id: string;
  name: string;
  created_at: string;
}

export interface CoachNoteRow {
  id: string;
  student_id: string;
  category: string;
  content: string;
  priority: string;
  source: string;
  is_active: number;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: number;
  created_at: string;
}
