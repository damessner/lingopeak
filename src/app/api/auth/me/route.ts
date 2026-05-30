import { verifySession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifySession(sessionCookie);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: payload });
  } catch (error) {
    console.error('Failed to get current user session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
