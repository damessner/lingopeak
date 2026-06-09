import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import WorksheetBuilderContainer from './WorksheetBuilderContainer';

interface PageProps {
  searchParams: Promise<{
    id?: string;
    categoryId?: string;
    tier?: string;
  }>;
}

export default async function BuilderPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const { id, categoryId, tier } = await searchParams;

  // Fetch Categories with Unit context
  const categories = db.prepare(`
    SELECT c.id, c.name, u.title as unit_title, u.order_num as unit_order 
    FROM categories c 
    JOIN units u ON c.unit_id = u.id 
    ORDER BY u.order_num ASC, c.name ASC
  `).all() as any[];

  let worksheet = null;
  if (id) {
    const wsRecord = db.prepare('SELECT id, title, category_id, tier, questions_json, badge_emoji, audio_url, image_url, video_url FROM worksheets WHERE id = ?').get(id) as any;
    if (wsRecord) {
      worksheet = {
        id: wsRecord.id,
        title: wsRecord.title,
        category_id: wsRecord.category_id,
        tier: wsRecord.tier,
        questions_json: wsRecord.questions_json,
        badge_emoji: wsRecord.badge_emoji,
        audio_url: wsRecord.audio_url,
        image_url: wsRecord.image_url,
        video_url: wsRecord.video_url
      };
    }
  } else if (categoryId) {
    const validTiers = ['EXPLORER', 'VOYAGER', 'CHALLENGER', 'SUMMIT'];
    const selectedTier = (tier && validTiers.includes(tier.toUpperCase())) ? (tier.toUpperCase() as any) : 'EXPLORER';
    worksheet = {
      title: '',
      category_id: categoryId,
      tier: selectedTier,
      questions_json: '[]',
      badge_emoji: '🥇',
      audio_url: '',
      image_url: '',
      video_url: ''
    };
  }

  return (
    <WorksheetBuilderContainer
      categories={categories}
      worksheet={worksheet}
      sessionUsername={session.username}
      sessionAvatar={session.avatarEmoji}
    />
  );
}
