'use client';

import WorksheetContainer from '@/components/worksheets/WorksheetContainer';
import { Question } from '@/lib/worksheet-types';

interface TestDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tier: string;
  questions: Question[];
}

export default function TestDriveModal({ isOpen, onClose, title, tier, questions }: TestDriveModalProps) {
  if (!isOpen) return null;

  const mockWorksheet = {
    id: 'preview_id',
    title: title || 'Untitled Worksheet (Preview)',
    tier: tier || 'EXPLORER',
    questionsJson: JSON.stringify(questions),
    audioUrl: null,
    imageUrl: null,
    videoUrl: null,
    transcript: null,
    isDialogue: false
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={onClose}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 px-5 rounded-xl border border-slate-800 transition-all cursor-pointer shadow-lg"
          style={{ minHeight: '40px' }}
        >
          ✕ Close Simulator
        </button>
      </div>

      <div className="w-full max-w-4xl py-12">
        <div className="text-center mb-6">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-2.5 py-1 rounded-lg border border-emerald-500/10 uppercase tracking-widest">
            🖥️ Student Mode Simulator
          </span>
          <p className="text-slate-400 text-xs mt-1">Bypasses database submissions. Scoring details are purely simulated.</p>
        </div>

        <WorksheetContainer
          worksheet={mockWorksheet}
          studentId="mock_student_id"
          previewMode={true}
          onPreviewClose={onClose}
        />
      </div>
    </div>
  );
}
