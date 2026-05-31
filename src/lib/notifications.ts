import db from './db';
import crypto from 'crypto';

/**
 * Creates a notification alert for a specific user.
 */
export function createNotification(userId: string, title: string, message: string) {
  try {
    const id = `notif_${crypto.randomUUID()}`;
    db.prepare('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?, 0)')
      .run(id, userId, title, message);
    return id;
  } catch (e) {
    console.error('Failed to create notification:', e);
    return null;
  }
}

/**
 * Broadcasts a notification alert to all teachers and administrators.
 */
export function notifyStaff(title: string, message: string) {
  try {
    const staff = db.prepare("SELECT id FROM users WHERE role = 'TEACHER' OR role = 'ADMIN'")
      .all() as Array<{ id: string }>;
    
    staff.forEach(member => {
      createNotification(member.id, title, message);
    });
  } catch (e) {
    console.error('Failed to notify staff:', e);
  }
}
