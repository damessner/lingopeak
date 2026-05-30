import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    // Guard: Only ADMIN role is authorized to download full database and assets backups
    if (!session || session.role !== 'ADMIN') {
      return new NextResponse('Unauthorized: Admin access required', { status: 403 });
    }

    const dbPath = path.resolve(process.cwd(), 'dev.db');
    const uploadsPath = path.resolve(process.cwd(), 'public/uploads');

    const zip = new AdmZip();

    // 1. Add SQLite Database file
    if (fs.existsSync(dbPath)) {
      zip.addLocalFile(dbPath);
    } else {
      console.warn('Database file not found for backup, creating partial archive.');
    }

    // 2. Add media uploads directory
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      if (files.length > 0) {
        zip.addLocalFolder(uploadsPath, 'uploads');
      }
    }

    // 3. Convert to buffer and return as response
    const zipBuffer = zip.toBuffer();
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=lingopeak-backup-${dateStr}.zip`,
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('Backup Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
