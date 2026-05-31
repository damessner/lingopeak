/**
 * POST /api/teacher/teams/webhook
 *
 * Saves (or clears) a teacher's MS Teams Incoming Webhook URL.
 * Validates the URL format and sends a test ping before persisting.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import { sendTeamsNotification } from '@/lib/teamsNotify';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get('session')?.value ?? '');

  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { webhookUrl } = await req.json() as { webhookUrl: string };

  // Allow clearing by passing empty string
  if (!webhookUrl || webhookUrl.trim() === '') {
    db.prepare('UPDATE users SET teams_webhook_url = NULL WHERE id = ?').run(session.userId);
    return NextResponse.json({ success: true, message: 'Webhook cleared.' });
  }

  // Basic URL validation
  if (!webhookUrl.startsWith('https://')) {
    return NextResponse.json({ error: 'Webhook URL must start with https://' }, { status: 400 });
  }

  // Send a test ping so the teacher can confirm it works immediately
  const pingOk = await sendTeamsNotification(webhookUrl.trim(), {
    title: '✅ LingoPeak Connected',
    subtitle: 'MS Teams Integration',
    body: 'Your MS Teams channel is now connected to LingoPeak. You will receive student struggle alerts and weekly class reports here.',
    actionUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    actionLabel: 'Open Teacher Dashboard'
  });

  if (!pingOk) {
    return NextResponse.json(
      { error: 'Could not reach the webhook URL. Please check it and try again.' },
      { status: 422 }
    );
  }

  db.prepare('UPDATE users SET teams_webhook_url = ? WHERE id = ?').run(webhookUrl.trim(), session.userId);

  return NextResponse.json({ success: true, message: 'Webhook saved and test message sent!' });
}

/**
 * GET /api/teacher/teams/webhook
 * Returns whether a webhook is currently configured (redacted URL).
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get('session')?.value ?? '');

  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = db.prepare('SELECT teams_webhook_url FROM users WHERE id = ?').get(session.userId) as
    | { teams_webhook_url: string | null }
    | undefined;

  const url = user?.teams_webhook_url ?? null;
  return NextResponse.json({
    configured: !!url,
    // Redact middle of URL to avoid leaking the full secret
    preview: url ? `${url.slice(0, 40)}…` : null
  });
}
