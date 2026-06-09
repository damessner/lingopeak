import db from '@/lib/db';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Authorize session: only TEACHER or ADMIN can fetch worksheets
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cur = searchParams.get('curriculum');

    if (cur === 'true') {
      const units = db.prepare('SELECT id, title, order_num FROM units ORDER BY order_num ASC').all() as any[];
      const categories = db.prepare('SELECT id, name, unit_id FROM categories ORDER BY name ASC').all() as any[];
      const worksheets = db.prepare('SELECT id, category_id, title, tier, questions_json, badge_emoji, audio_url, image_url, video_url, created_at FROM worksheets').all() as any[];
      
      const structuredUnits = units.map(unit => {
        const unitCats = categories.filter((c: any) => c.unit_id === unit.id).map(cat => {
          const catWorksheets = worksheets.filter((w: any) => w.category_id === cat.id);
          return {
            ...cat,
            worksheets: catWorksheets
          };
        });
        return {
          ...unit,
          categories: unitCats
        };
      });
      return NextResponse.json({ units: structuredUnits });
    }

    // Fetch worksheets with category details
    const worksheets = db.prepare(`
      SELECT w.id, w.title, w.tier, w.category_id, w.questions_json, w.created_at, w.badge_emoji,
             w.audio_url, w.image_url, w.video_url,
             c.name as category_name, u.title as unit_title
      FROM worksheets w
      LEFT JOIN categories c ON w.category_id = c.id
      LEFT JOIN units u ON c.unit_id = u.id
      ORDER BY w.created_at DESC
    `).all() as any[];

    return NextResponse.json(worksheets);
  } catch (error: any) {
    console.error('Fetch Worksheets Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorize session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { cloneId, id, title, categoryId, tier, questions, badgeEmoji, audioUrl, imageUrl, videoUrl, audio_url, image_url, video_url } = body;

    const finalAudioUrl = audioUrl !== undefined ? audioUrl : (audio_url !== undefined ? audio_url : null);
    const finalImageUrl = imageUrl !== undefined ? imageUrl : (image_url !== undefined ? image_url : null);
    const finalVideoUrl = videoUrl !== undefined ? videoUrl : (video_url !== undefined ? video_url : null);

    if (cloneId) {
      const original = db.prepare('SELECT * FROM worksheets WHERE id = ?').get(cloneId) as any;
      if (!original) {
        return NextResponse.json({ error: 'Worksheet to clone not found' }, { status: 404 });
      }
      const newId = crypto.randomUUID();
      const newTitle = `${original.title} (Copy)`;
      db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json, badge_emoji, audio_url, image_url, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(newId, original.category_id, newTitle, original.tier, original.questions_json, original.badge_emoji || '🥇', original.audio_url, original.image_url, original.video_url);
      return NextResponse.json({ success: true, id: newId });
    }

    if (!title || !categoryId || !tier || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    // Validate categoryId as a UUID to prevent SQL injections or bad references
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
    }

    // Format questions and inject IDs if missing
    const formattedQuestions = questions.map((q: any, index: number) => {
      const qId = q.id && q.id.startsWith('q_') ? q.id : `q_${Date.now()}_${index}`;
      const { id, type, question, ...rest } = q;
      return {
        id: qId,
        type,
        question,
        ...rest
      };
    });

    const questionsJson = JSON.stringify(formattedQuestions);

    if (id) {
      // Validate id format
      if (!uuidRegex.test(id)) {
        return NextResponse.json({ error: 'Invalid worksheet ID format' }, { status: 400 });
      }

      // Check if worksheet exists
      const existing = db.prepare('SELECT id FROM worksheets WHERE id = ?').get(id);
      if (!existing) {
        return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
      }

      // Update
      db.prepare('UPDATE worksheets SET title = ?, category_id = ?, tier = ?, questions_json = ?, badge_emoji = ?, audio_url = ?, image_url = ?, video_url = ? WHERE id = ?')
        .run(title, categoryId, tier, questionsJson, badgeEmoji || '🥇', finalAudioUrl, finalImageUrl, finalVideoUrl, id);

      return NextResponse.json({ success: true, id });
    } else {
      // Create new
      const newId = crypto.randomUUID();
      db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json, badge_emoji, audio_url, image_url, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(newId, categoryId, title, tier, questionsJson, badgeEmoji || '🥇', finalAudioUrl, finalImageUrl, finalVideoUrl);

      return NextResponse.json({ success: true, id: newId });
    }
  } catch (error: any) {
    console.error('Save Worksheet Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authorize session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });
    }

    // Validate ID as a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid worksheet ID format' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM worksheets WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM worksheets WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Worksheet Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
