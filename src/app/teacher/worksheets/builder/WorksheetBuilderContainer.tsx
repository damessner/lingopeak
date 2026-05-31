'use client';

import WorksheetBuilder from '@/components/teacher/WorksheetBuilder';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  unit_title: string;
  unit_order: number;
}

interface WorksheetBuilderContainerProps {
  categories: Category[];
  worksheet: any;
  sessionUsername: string;
  sessionAvatar: string;
}

export default function WorksheetBuilderContainer({
  categories,
  worksheet,
  sessionUsername,
  sessionAvatar
}: WorksheetBuilderContainerProps) {
  const router = useRouter();

  const handleSave = () => {
    router.push('/teacher/dashboard?tab=worksheets');
    router.refresh();
  };

  const handleCancel = () => {
    router.push('/teacher/dashboard?tab=worksheets');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/teacher/dashboard?tab=worksheets" className="flex items-center gap-3">
            <span className="text-3xl select-none">⛰️</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← Back to Staff Portal</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
            <span className="text-2xl">{sessionAvatar}</span>
            <span className="text-sm font-bold text-white">{sessionUsername}</span>
          </div>
        </div>
      </header>

      {/* Content Space */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-10 z-10">
        <WorksheetBuilder
          categories={categories}
          worksheet={worksheet}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
