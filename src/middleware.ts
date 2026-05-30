import { NextRequest, NextResponse } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'lingopeak_secret_default_key_change_me_12345'; // Keep aligned with session.ts

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
  matcher: ['/', '/login', '/register', '/student/:path*', '/teacher/:path*'],
};
