import { NextRequest, NextResponse } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NEXT_PHASE === 'phase-production-build' ? (() => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
})() : '');

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('CRITICAL CONFIGURATION ERROR: The SESSION_SECRET environment variable must be set and be at least 32 characters long.');
}

async function verifySessionEdge(sessionStr: string | undefined): Promise<any | null> {
  if (!sessionStr) return null;
  const parts = sessionStr.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payloadData = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      payloadData
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature !== expectedSignature) return null;
    const jsonStr = atob(payload);
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF Protection: Verify Origin/Referer for state-changing API requests
  if (pathname.startsWith('/api') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host'); // e.g. 'localhost:3000' or '192.168.178.157:3000'

    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return new NextResponse(JSON.stringify({ error: 'CSRF Protection: Invalid origin' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        return new NextResponse(JSON.stringify({ error: 'CSRF Protection: Malformed origin' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) {
          return new NextResponse(JSON.stringify({ error: 'CSRF Protection: Invalid referer' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        return new NextResponse(JSON.stringify({ error: 'CSRF Protection: Malformed referer' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // If neither origin nor referer header is present on a state-changing API request, we block it to be secure
      return new NextResponse(JSON.stringify({ error: 'CSRF Protection: Origin or Referer header required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const sessionCookie = request.cookies.get('session')?.value;
  const user = await verifySessionEdge(sessionCookie);

  // 1. Root route redirection
  if (pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
    }
    if (user.role === 'PENDING_TEACHER') {
      return NextResponse.redirect(new URL('/teacher/pending', request.url));
    }
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // 2. Auth routes (/login, /register) when already logged in
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      if (user.role === 'TEACHER' || user.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
      }
      if (user.role === 'PENDING_TEACHER') {
        return NextResponse.redirect(new URL('/teacher/pending', request.url));
      }
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 3. Protected student routes
  if (pathname.startsWith('/student')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow STUDENTS, TEACHERS, and ADMINS to see student view (for testing worksheets)
    return NextResponse.next();
  }

  // 4. Protected teacher routes
  if (pathname.startsWith('/teacher')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Special pending view
    if (pathname === '/teacher/pending') {
      if (user.role === 'PENDING_TEACHER') {
        return NextResponse.next();
      }
      // If they are not pending, send to dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Regular teacher dashboard protects against students & pending teachers
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      // Redirect students to student dashboard
      if (user.role === 'STUDENT') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url));
      }
      // Redirect pending teachers to pending page
      if (user.role === 'PENDING_TEACHER') {
        return NextResponse.redirect(new URL('/teacher/pending', request.url));
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/student/:path*', '/teacher/:path*', '/api/:path*'],
};
