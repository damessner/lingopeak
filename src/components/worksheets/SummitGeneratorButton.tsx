'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SummitGeneratorButtonProps {
  studentId: string;
  categoryId: string;
  unitId: string;
  categoryName: string;
}

export default function SummitGeneratorButton({
  studentId,
  categoryId,
  unitId,
  categoryName,
}: SummitGeneratorButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/student/summit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, categoryId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate Summit');
      }

      // Refresh and redirect to the newly generated worksheet
      router.push(`/student/units/${unitId}/${categoryName}?play=${data.worksheetId}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'API error. Make sure your AI key is set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl border border-indigo-400/20 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/25 transition-all cursor-pointer select-none flex items-center justify-center gap-2 min-h-[38px]"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating Custom Summit...
          </>
        ) : (
          <>Generate AI Summit 👑</>
        )}
      </button>
      
      {error && (
        <span className="text-[10px] text-red-400 font-semibold animate-fadeIn max-w-[200px] text-center">
          {error}
        </span>
      )}
    </div>
  );
}
