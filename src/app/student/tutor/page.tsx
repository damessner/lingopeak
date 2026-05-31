import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import StudentTutorClient from './StudentTutorClient';

export default async function StudentTutorPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

  return (
    <StudentTutorClient
      sessionUsername={session.username}
      sessionAvatar={session.avatarEmoji}
    />
  );
}
