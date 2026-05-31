'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Worksheet {
  id: string;
  title: string;
  category_id: string;
  tier: 'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT';
  questions_json: string;
  badge_emoji?: string;
  unit_title?: string;
  category_name?: string;
}

interface WorksheetsTabProps {
  displayMessage: (text: string, type: 'success' | 'error') => void;
}

export default function WorksheetsTab({ displayMessage }: WorksheetsTabProps) {
  const router = useRouter();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorksheets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/worksheets');
      if (res.ok) {
        const data = await res.json();
        setWorksheets(data);
      }
    } catch (e) {
      console.error('Failed to fetch worksheets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorksheets();
  }, []);

  const handleDeleteWorksheet = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the worksheet "${title}"?`)) return;
    try {
      const res = await fetch(`/api/teacher/worksheets?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        displayMessage(`Worksheet "${title}" deleted successfully.`, 'success');
        fetchWorksheets();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (e: any) {
      displayMessage(e.message, 'error');
    }
  };

  const handleCloneWorksheet = async (id: string, title: string) => {
    try {
      const res = await fetch('/api/teacher/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloneId: id })
      });
      if (res.ok) {
        displayMessage(`Worksheet "${title}" cloned successfully.`, 'success');
        fetchWorksheets();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to clone');
      }
    } catch (e: any) {
      displayMessage(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 print:bg-transparent print:border-none print:shadow-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4 no-print">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">Custom Worksheets</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manually construct and manage interactive worksheet lessons.</p>
          </div>

          <button
            onClick={() => {
              router.push('/teacher/worksheets/builder');
            }}
            className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold border border-indigo-400/20 text-xs py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2"
          >
            ➕ Create Custom Worksheet
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2.5 py-16 justify-center text-xs text-slate-500">
            <span className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading custom worksheets...</span>
          </div>
        ) : worksheets.length === 0 ? (
          <div className="p-16 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-center">
            <span className="text-4xl block filter grayscale opacity-45 select-none mb-3">📝</span>
            <p className="text-slate-400 text-sm font-bold">No custom worksheets found</p>
            <p className="text-slate-500 text-xs mt-1">Get started by creating your first manual worksheet using the builder.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/20 max-w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  <th className="py-4 px-5">Title</th>
                  <th className="py-4 px-4">Syllabus category</th>
                  <th className="py-4 px-4 text-center">Tier</th>
                  <th className="py-4 px-4 text-center">Questions</th>
                  <th className="py-4 px-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs font-semibold">
                {worksheets.map((ws) => {
                  let questionsCount = 0;
                  try {
                    const parsed = JSON.parse(ws.questions_json);
                    questionsCount = Array.isArray(parsed) ? parsed.length : 0;
                  } catch (e) {}

                  return (
                    <tr key={ws.id} className="hover:bg-slate-900/10">
                      <td className="py-3 px-5 font-bold text-white max-w-xs truncate flex items-center gap-2">
                        <span className="text-base select-none">{ws.badge_emoji || '🥇'}</span>
                        <span className="truncate">{ws.title}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {ws.unit_title ? `[${ws.unit_title.slice(0, 15)}...] ${ws.category_name}` : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                          ws.tier === 'EXPLORER' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          ws.tier === 'VOYAGER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          ws.tier === 'CHALLENGER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {ws.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {questionsCount}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 no-print">
                        <button
                          onClick={() => {
                            router.push(`/teacher/worksheets/builder?id=${ws.id}`);
                          }}
                          className="bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 hover:border-slate-750 py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Edit ✏️
                        </button>
                        <button
                          onClick={() => handleCloneWorksheet(ws.id, ws.title)}
                          className="bg-slate-900 hover:bg-slate-850 text-slate-355 border border-slate-800 hover:border-slate-750 py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Clone 👥
                        </button>
                        <button
                          onClick={() => handleDeleteWorksheet(ws.id, ws.title)}
                          className="bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-200 border border-red-950/30 hover:border-red-500/35 py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Delete ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
