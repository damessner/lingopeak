import db from '@/lib/db';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Authorize session: only TEACHER or ADMIN can upload files
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    
    const worksheetId = formData.get('worksheetId') as string;
    const uploadType = formData.get('type') as string; // 'audio', 'image', 'video', 'transcript'

    if (!worksheetId || !uploadType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const isNewWorksheet = worksheetId === 'new' || worksheetId.startsWith('new_');
    if (!isNewWorksheet) {
      // Validate worksheetId as a UUID to prevent path injection/directory traversal
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(worksheetId)) {
        return NextResponse.json({ error: 'Invalid worksheet ID format' }, { status: 400 });
      }

      // Check if worksheet exists
      const worksheet = db.prepare('SELECT id FROM worksheets WHERE id = ?').get(worksheetId);
      if (!worksheet) {
        return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
      }
    }

    // Case A: Transcript update (plain text, no file upload)
    if (uploadType === 'transcript') {
      const transcript = formData.get('transcript') as string;
      const isDialogueStr = formData.get('isDialogue') as string; // 'true' or 'false'
      const isDialogue = isDialogueStr === 'true' ? 1 : 0;

      db.prepare('UPDATE worksheets SET transcript = ?, is_dialogue = ? WHERE id = ?')
        .run(transcript, isDialogue, worksheetId);

      return NextResponse.json({ success: true, message: 'Transcript updated successfully' });
    }

    // Case B: Media File Upload
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Enforce 10MB file size limit to prevent disk-exhaustion attacks
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 10MB limit' }, { status: 400 });
    }

    // Validate file extension and MIME types to prevent malicious uploads
    const ext = path.extname(file.name).toLowerCase();
    const mime = file.type.toLowerCase();

    if (uploadType === 'audio') {
      const allowedExts = ['.mp3', '.wav', '.m4a', '.ogg'];
      if (!allowedExts.includes(ext) || !mime.startsWith('audio/')) {
        return NextResponse.json({ error: 'Invalid audio file type or extension' }, { status: 400 });
      }
    } else if (uploadType === 'image') {
      const allowedExts = ['.png', '.jpeg', '.jpg', '.webp', '.gif'];
      if (!allowedExts.includes(ext) || !mime.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid image file type or extension' }, { status: 400 });
      }
    } else if (uploadType === 'video') {
      const allowedExts = ['.mp4', '.webm', '.mov'];
      if (!allowedExts.includes(ext) || !mime.startsWith('video/')) {
        return NextResponse.json({ error: 'Invalid video file type or extension' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid media upload type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure uploads folder exists in public/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${uploadType}_${worksheetId}_${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    // Update corresponding worksheet column in SQLite
    if (!isNewWorksheet) {
      if (uploadType === 'audio') {
        db.prepare('UPDATE worksheets SET audio_url = ? WHERE id = ?').run(fileUrl, worksheetId);
      } else if (uploadType === 'image') {
        db.prepare('UPDATE worksheets SET image_url = ? WHERE id = ?').run(fileUrl, worksheetId);
      } else if (uploadType === 'video') {
        db.prepare('UPDATE worksheets SET video_url = ? WHERE id = ?').run(fileUrl, worksheetId);
      }
    }

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
