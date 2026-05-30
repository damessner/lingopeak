import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const worksheetId = formData.get('worksheetId') as string;
    const uploadType = formData.get('type') as string; // 'audio', 'image', 'video', 'transcript'

    if (!worksheetId || !uploadType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if worksheet exists
    const worksheet = db.prepare('SELECT id FROM worksheets WHERE id = ?').get(worksheetId);
    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure uploads folder exists in public/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name);
    const filename = `${uploadType}_${worksheetId}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    // Update corresponding worksheet column in SQLite
    if (uploadType === 'audio') {
      db.prepare('UPDATE worksheets SET audio_url = ? WHERE id = ?').run(fileUrl, worksheetId);
    } else if (uploadType === 'image') {
      db.prepare('UPDATE worksheets SET image_url = ? WHERE id = ?').run(fileUrl, worksheetId);
    } else if (uploadType === 'video') {
      db.prepare('UPDATE worksheets SET video_url = ? WHERE id = ?').run(fileUrl, worksheetId);
    } else {
      return NextResponse.json({ error: 'Invalid media upload type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
