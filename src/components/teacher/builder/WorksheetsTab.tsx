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

interface StructuredCategory {
  id: string;
  name: string;
  unit_id: string;
  worksheets: Worksheet[];
}

interface StructuredUnit {
  id: string;
  title: string;
  order_num: number;
  categories: StructuredCategory[];
}

interface WorksheetsTabProps {
  displayMessage: (text: string, type: 'success' | 'error') => void;
}

export default function WorksheetsTab({ displayMessage }: WorksheetsTabProps) {
  const router = useRouter();
  
  // View states
  const [viewMode, setViewMode] = useState<'list' | 'curriculum'>('curriculum');
  const [loading, setLoading] = useState(false);
  const [flatWorksheets, setFlatWorksheets] = useState<Worksheet[]>([]);
  const [curriculumUnits, setCurriculumUnits] = useState<StructuredUnit[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({ '1': true }); // Default Unit 1 expanded

  // Import Modal states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importUnitId, setImportUnitId] = useState('');
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importTier, setImportTier] = useState<'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT'>('EXPLORER');
  const [importTitle, setImportTitle] = useState('');
  const [importBadge, setImportBadge] = useState('🥇');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const fetchWorksheetsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch flat list
      const flatRes = await fetch('/api/teacher/worksheets');
      if (flatRes.ok) {
        const flatData = await flatRes.json();
        setFlatWorksheets(flatData);
      }

      // 2. Fetch structured curriculum list
      const curRes = await fetch('/api/teacher/worksheets?curriculum=true');
      if (curRes.ok) {
        const curData = await curRes.json();
        setCurriculumUnits(curData.units || []);
        
        // Initialize default select parameters for importer
        if (curData.units?.length > 0) {
          const firstUnit = curData.units[0];
          setImportUnitId(firstUnit.id);
          if (firstUnit.categories?.length > 0) {
            setImportCategoryId(firstUnit.categories[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to retrieve worksheets data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorksheetsData();
  }, []);

  // Update categories when selected unit changes in importer modal
  useEffect(() => {
    if (importUnitId && curriculumUnits.length > 0) {
      const selectedUnit = curriculumUnits.find(u => u.id === importUnitId);
      if (selectedUnit && selectedUnit.categories?.length > 0) {
        setImportCategoryId(selectedUnit.categories[0].id);
      } else {
        setImportCategoryId('');
      }
    }
  }, [importUnitId, curriculumUnits]);

  const handleDeleteWorksheet = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the worksheet "${title}"?`)) return;
    try {
      const res = await fetch(`/api/teacher/worksheets?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        displayMessage(`Worksheet "${title}" deleted successfully.`, 'success');
        fetchWorksheetsData();
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
        fetchWorksheetsData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to clone');
      }
    } catch (e: any) {
      displayMessage(e.message, 'error');
    }
  };

  const toggleUnit = (orderNum: number) => {
    setExpandedUnits(prev => ({
      ...prev,
      [orderNum]: !prev[orderNum]
    }));
  };

  // Preset JSON Schema for download
  const handleDownloadTemplate = () => {
    const template = [
      {
        "type": "multiple_choice",
        "question": "Which word completes the classroom rule: 'Please _______ quiet.'?",
        "options": ["be", "do", "go", "have"],
        "answer": "be"
      },
      {
        "type": "fill_in_gap",
        "question": "Fill in the correct singular or plural form.",
        "text": "There is one pencil on the #desk# (table), and there are three #pencils# on the shelf."
      },
      {
        "type": "sentence_unscramble",
        "question": "Unscramble the classroom command.",
        "words": ["Please", "open", "your", "books", "."]
      },
      {
        "type": "matching_pairs",
        "question": "Match the singular items to their plural partners.",
        "pairs": {
          "child": "children",
          "mouse": "mice",
          "box": "boxes",
          "ruler": "rulers"
        }
      },
      {
        "type": "drag_and_drop",
        "question": "Drag the correct prepositions into the description.",
        "sentences": [
          "The clock hangs #on# the wall.",
          "The waste bin sits #next to# the door."
        ],
        "distractors": ["under", "between", "behind"]
      },
      {
        "type": "category_sorting",
        "question": "Sort the colors into Light vs Dark categories.",
        "categories": ["Light Colors", "Dark Colors"],
        "items": [
          {"text": "white", "category": "Light Colors"},
          {"text": "black", "category": "Dark Colors"},
          {"text": "yellow", "category": "Light Colors"},
          {"text": "brown", "category": "Dark Colors"}
        ]
      },
      {
        "type": "correct_the_mistake",
        "question": "Correct the spelling/grammar mistake in the sentence.",
        "text": "We study English on monday.",
        "mistake": "monday",
        "correction": "Monday"
      },
      {
        "type": "choice_matrix",
        "question": "Decide if these commands are Positive or Negative.",
        "rows": [
          "Stand up!##Positive",
          "Don't shout!##Negative",
          "Write your name!##Positive"
        ],
        "columns": ["Positive", "Negative"],
        "answers": {
          "Stand up!": "Positive",
          "Don't shout!": "Negative",
          "Write your name!": "Positive"
        }
      },
      {
        "type": "order_sentences",
        "question": "Order the morning steps chronologically.",
        "sentences": [
          "First, my alarm rings at 7:00 AM.",
          "Second, I got out of bed and got dressed.",
          "Third, I pack my schoolbag with books.",
          "Finally, I walk to school."
        ]
      }
    ];

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(template, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'lingopeak_worksheet_template.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    displayMessage('JSON Template downloaded successfully!', 'success');
  };

  // Copy Template JSON text to clipboard
  const handleCopyTemplateText = () => {
    const template = [
      {
        "type": "multiple_choice",
        "question": "Which word completes the classroom rule: 'Please _______ quiet.'?",
        "options": ["be", "do", "go", "have"],
        "answer": "be"
      },
      {
        "type": "fill_in_gap",
        "question": "Fill in the correct singular or plural form.",
        "text": "There is one pencil on the #desk# (table), and there are three #pencils# on the shelf."
      }
    ];
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    displayMessage('Template JSON copied to clipboard!', 'success');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    if (!importTitle.trim()) {
      setImportError('Worksheet Title is required.');
      return;
    }
    if (!importCategoryId) {
      setImportError('Curriculum category is required.');
      return;
    }
    if (!importJsonText.trim()) {
      setImportError('JSON questions content is empty.');
      return;
    }

    try {
      let cleanText = importJsonText.trim();

      // Find the first '[' and last ']' to extract the array block
      const firstBracket = cleanText.indexOf('[');
      const lastBracket = cleanText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      }

      let parsedQuestions: any = null;
      try {
        parsedQuestions = JSON.parse(cleanText);
      } catch (jsonErr) {
        // Fall back to a safe JS evaluator to allow trailing commas, single quotes, and comments
        try {
          const forbiddenPatterns = /window|document|fetch|xmlhttprequest|eval|cookie|localStorage|sessionStorage|location|history/i;
          if (forbiddenPatterns.test(cleanText)) {
            throw new Error("Pasted content contains forbidden browser keywords for security reasons.");
          }
          
          const evalFn = new Function(`return ${cleanText}`);
          parsedQuestions = evalFn();
        } catch (evalErr: any) {
          throw new Error(`Failed to parse as JSON or JavaScript: ${evalErr.message || evalErr}`);
        }
      }

      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Pasted content must resolve to a JSON/JavaScript array of question objects.');
      }
      if (parsedQuestions.length === 0) {
        throw new Error('The questions array must have at least one question item.');
      }

      // Quick validate types
      const allowedTypes = [
        'multiple_choice', 'fill_in_gap', 'sentence_unscramble', 'matching_pairs',
        'drag_and_drop', 'category_sorting', 'correct_the_mistake', 'choice_matrix',
        'crossword', 'word_search', 'order_sentences'
      ];
      for (let i = 0; i < parsedQuestions.length; i++) {
        const item = parsedQuestions[i];
        if (!item.type || !allowedTypes.includes(item.type)) {
          throw new Error(`Item ${i + 1} has an invalid or missing type: "${item.type || 'undefined'}".`);
        }
        if (!item.question || !item.question.trim()) {
          throw new Error(`Item ${i + 1} is missing the "question" instruction text.`);
        }
      }

      // Post
      const res = await fetch('/api/teacher/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: importTitle.trim(),
          categoryId: importCategoryId,
          tier: importTier,
          questions: parsedQuestions,
          badgeEmoji: importBadge,
          audioUrl: null,
          imageUrl: null,
          videoUrl: null
        })
      });

      if (res.ok) {
        const data = await res.json();
        displayMessage(`Worksheet "${importTitle}" successfully imported with ${parsedQuestions.length} items!`, 'success');
        setIsImportOpen(false);
        setImportTitle('');
        setImportJsonText('');
        fetchWorksheetsData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Server rejected worksheet import.');
      }

    } catch (err: any) {
      setImportError(err.message || 'Malformed JSON. Check bracket counts and syntax.');
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toUpperCase()) {
      case 'GRAMMAR': return '📝';
      case 'VOCABULARY': return '📖';
      case 'READING': return '📚';
      case 'WRITING': return '✏️';
      case 'LISTENING': return '🎧';
      default: return '📘';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4 no-print">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">Custom Worksheets</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manually construct, manage, or import interactive worksheet exercises.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1.5 mr-2">
              <button
                onClick={() => setViewMode('curriculum')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'curriculum'
                    ? 'bg-indigo-650 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🗺️ Curriculum View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-indigo-650 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 List View
              </button>
            </div>

            <button
              onClick={() => setIsImportOpen(true)}
              className="bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold border border-slate-800 text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2"
            >
              🤖 Import AI JSON
            </button>

            <button
              onClick={() => {
                router.push('/teacher/worksheets/builder');
              }}
              className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold border border-indigo-400/20 text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2"
            >
              ➕ Create Worksheet
            </button>
          </div>
        </div>

        {/* 2. Loading State */}
        {loading ? (
          <div className="flex items-center gap-2.5 py-24 justify-center text-xs text-slate-500">
            <span className="w-4 h-4 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
            <span>Retrieving school worksheets...</span>
          </div>
        ) : viewMode === 'list' ? (
          
          /* 3. Flat List View */
          flatWorksheets.length === 0 ? (
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
                  {flatWorksheets.map((ws) => {
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
                          {ws.unit_title ? `[Unit ${ws.unit_title.split(':')[0] || ''}] ${ws.category_name}` : 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                            ws.tier === 'EXPLORER' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            ws.tier === 'VOYAGER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            ws.tier === 'CHALLENGER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-violet-500/10 text-violet-400 border-violet-500/20'
                          }`}>
                            {ws.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400">{questionsCount}</td>
                        <td className="py-3 px-4 text-right space-x-2 no-print">
                          <button
                            onClick={() => router.push(`/teacher/worksheets/builder?id=${ws.id}`)}
                            className="bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 hover:border-slate-750 py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Edit ✏
                          </button>
                          <button
                            onClick={() => handleCloneWorksheet(ws.id, ws.title)}
                            className="bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 hover:border-slate-750 py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
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
          )
        ) : (
          
          /* 4. Curriculum View (Unit -> Category -> Tier Accordion Grid) */
          <div className="space-y-4">
            {curriculumUnits.map((unit) => {
              const isExpanded = expandedUnits[unit.order_num] || false;

              return (
                <div key={unit.id} className="bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden transition-all duration-300">
                  {/* Collapsible Unit Header */}
                  <div
                    onClick={() => toggleUnit(unit.order_num)}
                    className="flex justify-between items-center bg-slate-950/70 p-4 border-b border-slate-900 cursor-pointer select-none hover:bg-slate-900/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📚</span>
                      <div>
                        <h3 className="text-sm font-black text-white tracking-tight">UNIT {unit.order_num}: {unit.title}</h3>
                        <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Syllabus Categories &amp; Active Choice Blocks</p>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-extrabold">{isExpanded ? '▲ Collapse' : '▼ Expand'}</span>
                  </div>

                  {/* Collapsed/Expanded categories details */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 divide-y divide-slate-900/60">
                      {unit.categories.map((cat) => {
                        const icon = getCategoryIcon(cat.name);
                        
                        // Group worksheets by tier
                        const explorerWS = cat.worksheets.filter(w => w.tier === 'EXPLORER');
                        const voyagerWS = cat.worksheets.filter(w => w.tier === 'VOYAGER');
                        const challengerWS = cat.worksheets.filter(w => w.tier === 'CHALLENGER');
                        const summitWS = cat.worksheets.filter(w => w.tier === 'SUMMIT');

                        const renderTierBlock = (tierName: 'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT', wsList: Worksheet[]) => {
                          const tierBadgeClass = 
                            tierName === 'EXPLORER' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            tierName === 'VOYAGER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            tierName === 'CHALLENGER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-violet-500/10 text-violet-400 border-violet-500/20';

                          return (
                            <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 gap-3 border-b border-slate-900/30 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${tierBadgeClass}`}>
                                  {tierName}
                                </span>
                                
                                <div className="flex flex-wrap gap-2.5 items-center">
                                  {wsList.length === 0 ? (
                                    <span className="text-[11px] text-slate-500 italic pl-1">No worksheets. Pupils choose nothing.</span>
                                  ) : (
                                    wsList.map(ws => {
                                      let count = 0;
                                      try { count = JSON.parse(ws.questions_json).length; } catch (e) {}

                                      return (
                                        <div
                                          key={ws.id}
                                          className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-xl text-xs text-white"
                                        >
                                          <span>{ws.badge_emoji || '🥇'}</span>
                                          <span className="font-extrabold max-w-[120px] truncate">{ws.title}</span>
                                          <span className="text-[9px] text-slate-500">({count} items)</span>
                                          
                                          <button
                                            onClick={() => router.push(`/teacher/worksheets/builder?id=${ws.id}`)}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-200 cursor-pointer ml-1 select-none font-bold"
                                            title="Edit Worksheet"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteWorksheet(ws.id, ws.title)}
                                            className="text-[10px] text-red-500 hover:text-red-300 cursor-pointer ml-1 select-none font-bold"
                                            title="Delete Worksheet"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  router.push(`/teacher/worksheets/builder?categoryId=${cat.id}&tier=${tierName}`);
                                }}
                                className="bg-slate-900 hover:bg-indigo-650/20 text-slate-400 hover:text-indigo-300 border border-slate-850 hover:border-indigo-500/25 py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all self-start md:self-auto cursor-pointer"
                              >
                                ➕ Add Block
                              </button>
                            </div>
                          );
                        };

                        return (
                          <div key={cat.id} className="grid grid-cols-1 lg:grid-cols-4 gap-4 py-4 first:pt-0 last:pb-0">
                            {/* Category Column Left */}
                            <div className="lg:col-span-1 flex items-center gap-2 text-white font-extrabold pb-2 lg:pb-0">
                              <span className="text-lg">{icon}</span>
                              <span className="tracking-wide uppercase text-xs">{cat.name}</span>
                            </div>

                            {/* Tiers List Right */}
                            <div className="lg:col-span-3 space-y-1">
                              {renderTierBlock('EXPLORER', explorerWS)}
                              {renderTierBlock('VOYAGER', voyagerWS)}
                              {renderTierBlock('CHALLENGER', challengerWS)}
                              {renderTierBlock('SUMMIT', summitWS)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. AI JSON Import Modal Dialog */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  🤖 Import AI-Generated Worksheet JSON
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Quickly import question codes generated by another AI tutor.</p>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-slate-400 hover:text-white font-black text-sm p-1 cursor-pointer select-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleImportSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Error Notice */}
              {importError && (
                <div className="p-3.5 bg-red-950/30 border border-red-500/20 rounded-xl text-[11px] text-red-200 font-semibold leading-relaxed">
                  ⚠️ {importError}
                </div>
              )}

              {/* Grid Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unit */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest">Target Unit</label>
                  <select
                    value={importUnitId}
                    onChange={(e) => setImportUnitId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-bold outline-none cursor-pointer"
                  >
                    {curriculumUnits.map(u => (
                      <option key={u.id} value={u.id}>Unit {u.order_num}: {u.title.slice(0, 20)}...</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest">Target Category</label>
                  <select
                    value={importCategoryId}
                    onChange={(e) => setImportCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-bold outline-none cursor-pointer"
                    disabled={!importUnitId}
                  >
                    {importUnitId && curriculumUnits.find(u => u.id === importUnitId)?.categories.map(c => (
                      <option key={c.id} value={c.id}>{getCategoryIcon(c.name)} {c.name}</option>
                    )) || <option value="">No categories</option>}
                  </select>
                </div>

                {/* Tier */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest">Difficulty Tier</label>
                  <select
                    value={importTier}
                    onChange={(e) => setImportTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-bold outline-none cursor-pointer"
                  >
                    <option value="EXPLORER">Explorer (Easy)</option>
                    <option value="VOYAGER">Voyager (Medium)</option>
                    <option value="CHALLENGER">Challenger (Hard)</option>
                    <option value="SUMMIT">AI Summit Finisher</option>
                  </select>
                </div>

                {/* Badge Emoji */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest">Badge Reward Emoji</label>
                  <input
                    type="text"
                    value={importBadge}
                    onChange={(e) => setImportBadge(e.target.value)}
                    placeholder="e.g. 🥇"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest">Worksheet Title</label>
                <input
                  type="text"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="e.g. Grammar Detective: Safari Plurals"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
                />
              </div>

              {/* JSON Paste Code area */}
              <div className="space-y-1 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest">Paste AI JSON Question Codes</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTemplateText}
                      className="text-[9px] font-bold text-slate-450 hover:text-white cursor-pointer select-none"
                    >
                      📋 Copy Sample JSON
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-[9px] font-bold text-indigo-400 hover:text-indigo-200 cursor-pointer select-none"
                    >
                      📥 Download Full Template
                    </button>
                  </div>
                </div>
                
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "type": "multiple_choice",\n    "question": "Which word completes the rule: 'Please _______ quiet.'?",\n    "options": ["be", "do", "go", "have"],\n    "answer": "be"\n  }\n]`}
                  className="w-full flex-1 min-h-[160px] bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-350 font-mono focus:border-indigo-500 outline-none leading-relaxed"
                />
                <p className="text-[9px] text-slate-550 leading-relaxed font-semibold">
                  Make sure you supply a valid JSON array matching the LingoPeak schema format. Tapping "Download Full Template" generates a file containing all 10 interactive widgets setups.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-slate-800/80 pt-4 flex justify-end gap-2.5 bg-slate-900 no-print">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-300 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-500/20 text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-lg"
                >
                  Verify &amp; Save Worksheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
