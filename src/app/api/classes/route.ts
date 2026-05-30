import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const classes = db.prepare('SELECT id, name FROM classes ORDER BY name ASC').all();
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
