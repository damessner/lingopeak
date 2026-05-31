/**
 * teamsNotify.ts
 * 
 * Sends structured Adaptive Card notifications to a Microsoft Teams channel via
 * the Incoming Webhook connector. No bot registration needed — teachers paste
 * their webhook URL in their profile settings page.
 * 
 * Reference: https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using
 */

export interface TeamsNotifyPayload {
  title: string;
  subtitle?: string;
  body: string;
  facts?: Array<{ name: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Sends an Adaptive Card message to the given MS Teams Incoming Webhook URL.
 * Fails silently in production so a webhook misconfiguration never breaks the
 * student-facing flow.
 */
export async function sendTeamsNotification(
  webhookUrl: string,
  payload: TeamsNotifyPayload
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://')) return false;

  const card: Record<string, unknown> = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: payload.title,
              wrap: true
            },
            ...(payload.subtitle
              ? [{ type: 'TextBlock', size: 'Small', text: payload.subtitle, isSubtle: true, wrap: true }]
              : []),
            {
              type: 'TextBlock',
              text: payload.body,
              wrap: true
            },
            ...(payload.facts && payload.facts.length > 0
              ? [
                  {
                    type: 'FactSet',
                    facts: payload.facts.map(f => ({ title: f.name, value: f.value }))
                  }
                ]
              : [])
          ],
          actions: payload.actionUrl
            ? [
                {
                  type: 'Action.OpenUrl',
                  title: payload.actionLabel ?? 'Open LingoPeak',
                  url: payload.actionUrl
                }
              ]
            : []
        }
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });

    if (!res.ok) {
      console.warn(`[teamsNotify] Webhook responded with ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[teamsNotify] Failed to send notification:', err);
    return false;
  }
}

// ─── Convenience helpers ───────────────────────────────────────────────────────

export async function notifyTeacherStruggle(opts: {
  webhookUrl: string;
  teacherName: string;
  studentName: string;
  topicName: string;
  score: number;
  platformUrl?: string;
}): Promise<void> {
  await sendTeamsNotification(opts.webhookUrl, {
    title: '⚠️ Student Needs Help',
    subtitle: `LingoPeak — Learning Coach Alert`,
    body: `**${opts.studentName}** is struggling with **${opts.topicName}** (score: ${opts.score}%).`,
    facts: [
      { name: 'Student', value: opts.studentName },
      { name: 'Topic', value: opts.topicName },
      { name: 'Score', value: `${opts.score}%` }
    ],
    actionUrl: opts.platformUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    actionLabel: 'View Dashboard'
  });
}

export async function notifyTeacherWeeklyReport(opts: {
  webhookUrl: string;
  classAvg: number;
  studentsAtRisk: number;
  topStruggle: string;
  platformUrl?: string;
}): Promise<void> {
  await sendTeamsNotification(opts.webhookUrl, {
    title: '📊 Weekly Class Report',
    subtitle: 'LingoPeak — Automated Summary',
    body: `Here's your class performance snapshot for this week.`,
    facts: [
      { name: 'Class Average', value: `${opts.classAvg}%` },
      { name: 'Students At Risk', value: String(opts.studentsAtRisk) },
      { name: 'Top Struggle Area', value: opts.topStruggle || 'N/A' }
    ],
    actionUrl: opts.platformUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    actionLabel: 'Open Teacher Dashboard'
  });
}
