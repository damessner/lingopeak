'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WorksheetsTab from '@/components/teacher/builder/WorksheetsTab';
import NotificationBell from '@/components/NotificationBell';

interface Student {
  id: string;
  username: string;
  avatar_emoji: string;
  class_name: string | null;
  class_id: string | null;
}

interface PendingStaff {
  id: string;
  username: string;
  avatar_emoji: string;
}

interface StaffMember {
  id: string;
  username: string;
  avatar_emoji: string;
  class_id: string | null;
  class_name: string | null;
  role: string;
}

interface SchoolClass {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  unit_title: string;
  unit_order: number;
}

interface TeacherDashboardClientProps {
  initialStudents: Student[];
  initialPendings: PendingStaff[];
  initialStaff: StaffMember[];
  classes: SchoolClass[];
  categories: Category[];
  heatmapScores: Record<string, number>; // key is `${studentId}_${categoryId}`
  sessionUsername: string;
  sessionAvatar: string;
  sessionRole: string;
  handleLogoutAction: () => Promise<void>;
}

export default function TeacherDashboardClient({
  initialStudents,
  initialPendings,
  initialStaff,
  classes,
  categories,
  heatmapScores,
  sessionUsername,
  sessionAvatar,
  sessionRole,
  handleLogoutAction
}: TeacherDashboardClientProps) {
  const router = useRouter();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'pupils' | 'heatmap' | 'struggles' | 'ai-revision' | 'worksheets' | 'pending' | 'admin' | 'classes'>('heatmap');

  // Class selection state (default to first class if available)
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedRevisionClassId, setSelectedRevisionClassId] = useState<string>(classes[0]?.id || '');

  // Filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  // Pending staff list state
  const [pendings, setPendings] = useState<PendingStaff[]>(initialPendings);
  const [students, setStudents] = useState<Student[]>(initialStudents);

  // Local state variables for dynamic client-side list updates
  const [classesList, setClassesList] = useState<SchoolClass[]>(classes);
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [newClassName, setNewClassName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  // AI revision generator state
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisionReport, setRevisionReport] = useState<string | null>(null);

  // General loading & message states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const displayMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Check for tab parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'worksheets') {
        setActiveTab('worksheets');
      }
    }
  }, []);

  // 1. Reset student password handler
  const handleResetPassword = async (studentId: string, username: string) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (newPassword === null) return; // cancelled
    if (newPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/students/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      displayMessage(`Password for ${username} reset successfully!`, 'success');
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Approve pending staff account
  const handleApproveTeacher = async (userId: string, username: string) => {
    if (!confirm(`Approve staff account for ${username}?`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve account');
      }

      // Remove from UI list
      setPendings(prev => prev.filter(p => p.id !== userId));
      displayMessage(`Approved staff account for ${username}.`, 'success');
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2.5 Classes CRUD and Roster Assignment handlers
  const handleAssignStudentClass = async (studentId: string, classId: string | null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, classId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reassign student');
      }

      const assignedClass = classesList.find(c => c.id === classId);
      const className = assignedClass ? assignedClass.name : null;

      // Update students state
      setStudents(prev =>
        prev.map(s =>
          s.id === studentId ? { ...s, class_id: classId, class_name: className } : s
        )
      );

      displayMessage(`Reassigned student to Class ${className || 'Unassigned'}.`, 'success');
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaffClass = async (staffId: string, classId: string | null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: staffId, classId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reassign staff');
      }

      const assignedClass = classesList.find(c => c.id === classId);
      const className = assignedClass ? assignedClass.name : null;

      // Update staff state
      setStaffList(prev =>
        prev.map(s =>
          s.id === staffId ? { ...s, class_id: classId, class_name: className } : s
        )
      );

      displayMessage(`Reassigned teacher to Class ${className || 'Unassigned'}.`, 'success');
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClassName.trim();
    if (!name) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create class');
      }

      const data = await res.json();
      setClassesList(prev => [...prev, data.class].sort((a, b) => a.name.localeCompare(b.name)));
      setNewClassName('');
      displayMessage(`Class "${name}" created successfully.`, 'success');
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenameClass = async (id: string) => {
    const name = editingClassName.trim();
    if (!name) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to rename class');
      }

      // Update classes state
      setClassesList(prev =>
        prev.map(c => (c.id === id ? { ...c, name } : c)).sort((a, b) => a.name.localeCompare(b.name))
      );

      // Update students state with the new class name
      setStudents(prev =>
        prev.map(s => (s.class_id === id ? { ...s, class_name: name } : s))
      );

      // Update staff state with the new class name
      setStaffList(prev =>
        prev.map(s => (s.class_id === id ? { ...s, class_name: name } : s))
      );

      setEditingClassId(null);
      setEditingClassName('');
      displayMessage(`Class renamed to "${name}" successfully.`, 'success');
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Class "${name}"? All assigned students and teachers will become Unassigned.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete class');
      }

      // Remove class from classes state
      setClassesList(prev => prev.filter(c => c.id !== id));

      // Update students state to set class_id/class_name to null
      setStudents(prev =>
        prev.map(s => (s.class_id === id ? { ...s, class_id: null, class_name: null } : s))
      );

      // Update staff state to set class_id/class_name to null
      setStaffList(prev =>
        prev.map(s => (s.class_id === id ? { ...s, class_id: null, class_name: null } : s))
      );

      // Fallback selection of class id if active one is deleted
      if (selectedClassId === id) setSelectedClassId(classesList.find(c => c.id !== id)?.id || '');
      if (selectedRevisionClassId === id) setSelectedRevisionClassId(classesList.find(c => c.id !== id)?.id || '');

      displayMessage(`Class "${name}" deleted.`, 'success');
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate AI revision generator lesson plan
  const handleGenerateRevision = async () => {
    if (!selectedRevisionClassId) return;

    setRevisionLoading(true);
    setRevisionReport(null);

    try {
      const res = await fetch('/api/teacher/class-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedRevisionClassId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate revision');
      }

      const data = await res.json();
      setRevisionReport(data.analysis);
    } catch (err: any) {
      displayMessage(err.message, 'error');
    } finally {
      setRevisionLoading(false);
    }
  };

  // Compute student filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.username.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = classFilter === 'ALL' || student.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  // Compute struggling pupils (pupils with at least one score below 60% OR whose average score is low)
  const computeStrugglingStudents = () => {
    return students.map(st => {
      // Find all category scores for this student
      const studentScores = categories.map(cat => heatmapScores[`${st.id}_${cat.id}`]).filter(score => score !== undefined);
      
      const failedUnits = categories.filter(cat => {
        const score = heatmapScores[`${st.id}_${cat.id}`];
        return score !== undefined && score > 0 && score < 60;
      });

      const averageScore = studentScores.length > 0
        ? studentScores.reduce((a, b) => a + b, 0) / studentScores.length
        : 100;

      return {
        ...st,
        failedUnits,
        averageScore,
        scoreCount: studentScores.length
      };
    }).filter(st => st.failedUnits.length > 0 || (st.scoreCount > 0 && st.averageScore < 70))
      .sort((a, b) => a.averageScore - b.averageScore);
  };

  const strugglingStudents = computeStrugglingStudents();

  // Print progress report utility
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.2)]">🎓</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full ml-2 border border-indigo-500/10">Staff Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
              <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">{sessionAvatar}</span>
              <div className="text-left leading-tight">
                <div className="text-sm font-bold text-white max-w-[120px] truncate">{sessionUsername}</div>
                <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{sessionRole} Dashboard</div>
              </div>
            </div>

            <NotificationBell />

            <Link
              href="/student/dashboard"
              className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/20 transition-all rounded-xl py-2 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              👁️ Student View
            </Link>

            <button
              onClick={() => handleLogoutAction()}
              className="bg-slate-900/60 hover:bg-red-950/30 hover:border-red-500/30 text-slate-400 hover:text-red-200 border border-slate-800 hover:shadow-lg transition-all rounded-xl py-2 px-4 text-xs font-bold cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl animate-scaleUp text-xs font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}
        >
          <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 z-10 space-y-8 print:p-0">
        
        {/* Navigation Tabs (No-Print) */}
        <div className="flex gap-2 flex-wrap border-b border-slate-800 pb-4 no-print">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🔥 Progress Heatmap
          </button>
          <button
            onClick={() => setActiveTab('struggles')}
            className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'struggles'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🚨 Struggle list ({strugglingStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('ai-revision')}
            className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'ai-revision'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🤖 AI Class Review Plan
          </button>
          <button
            onClick={() => {
              setActiveTab('worksheets');
            }}
            className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'worksheets'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            📝 Custom Worksheets
          </button>
          <button
            onClick={() => setActiveTab('pupils')}
            className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'pupils'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 Registered Pupils ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🏫 Classes & Roster
          </button>
          {sessionRole === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/40'
              }`}
            >
              🛠️ Admin Panel {pendings.length > 0 ? `(${pendings.length})` : ''}
            </button>
          )}
          {sessionRole !== 'ADMIN' && pendings.length > 0 && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/40`}
            >
              ⏳ Pending Staff ({pendings.length})
            </button>
          )}
        </div>

        {/* 1. HEATMAP VIEW */}
        {activeTab === 'heatmap' && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 print:bg-transparent print:border-none print:shadow-none">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4 no-print">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">Class Progress Heatmap</h2>
                <p className="text-xs text-slate-400 mt-0.5">Visually track student syllabus masteries.</p>
              </div>

              <div className="flex gap-3">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 font-bold outline-none cursor-pointer"
                >
                  {classesList.map(cl => (
                    <option key={cl.id} value={cl.id}>Class {cl.name}</option>
                  ))}
                </select>

                <button
                  onClick={triggerPrint}
                  className="bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold border border-slate-800 text-xs py-2 px-4 rounded-xl cursor-pointer transition-all shadow-md"
                >
                  🖨️ Print View
                </button>
              </div>
            </div>

            {/* Heatmap Grid */}
            {(() => {
              const classStudents = students.filter(s => s.class_id === selectedClassId);
              if (classStudents.length === 0) {
                return <p className="text-slate-500 text-sm text-center py-10">No students enrolled in this class yet.</p>;
              }

              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/20 max-w-full">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                        <th className="py-4 px-4 sticky left-0 bg-slate-900/90 z-20 w-44">Pupil</th>
                        {categories.map((cat, idx) => (
                          <th key={cat.id} className="py-4 px-3 text-center border-l border-slate-900 font-semibold" title={cat.unit_title}>
                            <span className="block text-[8px] text-slate-500">{cat.unit_title.slice(0, 10)}...</span>
                            <span>{cat.name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {classStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-900/10">
                          {/* Student identity (sticky left for scrolling) */}
                          <td className="py-3 px-4 sticky left-0 bg-slate-950/90 border-r border-slate-900 font-bold text-white z-10 flex items-center gap-2">
                            <span className="text-lg select-none">{st.avatar_emoji}</span>
                            <span className="truncate max-w-[130px]">{st.username}</span>
                          </td>

                          {/* Category mastery scores */}
                          {categories.map((cat) => {
                            const score = heatmapScores[`${st.id}_${cat.id}`];
                            let cellColor = 'bg-slate-900/30 text-slate-500 border-slate-850';
                            let scoreText = '—';

                            if (score !== undefined && score > 0) {
                              scoreText = `${Math.round(score)}%`;
                              if (score >= 80) {
                                cellColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black';
                              } else if (score >= 60) {
                                cellColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold';
                              } else {
                                cellColor = 'bg-red-500/20 text-red-400 border-red-500/30 font-bold';
                              }
                            }

                            return (
                              <td key={cat.id} className={`py-3 px-2 border-l border-slate-900 text-center border-b border-transparent`}>
                                <div className={`w-fit mx-auto px-2.5 py-1 rounded-lg border text-[11px] min-w-[50px] ${cellColor}`}>
                                  {scoreText}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Heatmap Legend */}
            <div className="flex gap-6 justify-center flex-wrap pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-bold uppercase tracking-wider no-print">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-900/30 border border-slate-800" />
                <span>Not Started</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-red-500/20 border border-red-500/30" />
                <span>Struggling (&lt; 60%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/30" />
                <span>Almost Passing (60-79%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/30" />
                <span>Mastered (80%+)</span>
              </div>
            </div>

          </section>
        )}

        {/* 2. STRUGGLE LIST VIEW */}
        {activeTab === 'struggles' && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">Pupil Struggle Indicators</h2>
              <p className="text-xs text-slate-400 mt-0.5">Identifies students who require extra pedagogical attention.</p>
            </div>

            {strugglingStudents.length === 0 ? (
              <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-8 text-center text-emerald-400 font-bold">
                🎉 Awesome! No pupils are currently flagged as struggling.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strugglingStudents.map((st) => (
                  <div
                    key={st.id}
                    className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-red-500/20 transition-all duration-300 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl select-none">{st.avatar_emoji}</span>
                        <div>
                          <h4 className="text-sm font-black text-white">{st.username}</h4>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Class {st.class_name || 'Unassigned'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] text-slate-500 font-bold uppercase">Average Score</span>
                        <span className={`text-sm font-black ${st.averageScore < 60 ? 'text-red-400' : 'text-amber-400'}`}>
                          {Math.round(st.averageScore)}%
                        </span>
                      </div>
                    </div>

                    {/* Stuggled syllabus topics */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-red-400 font-black uppercase tracking-wider">Struggling Categories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {st.failedUnits.map(cat => (
                          <span key={cat.id} className="text-[9px] bg-red-500/10 text-red-300 border border-red-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider" title={cat.unit_title}>
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action recommendations */}
                    <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-xs">
                      <Link
                        href={`/teacher/reports/${st.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-bold text-xs"
                      >
                        Detailed Progress Report →
                      </Link>
                      
                      <button
                        onClick={() => handleResetPassword(st.id, st.username)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 font-bold py-1 px-3 rounded-lg"
                      >
                        Reset PW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. AI REVISION PLANNER VIEW */}
        {activeTab === 'ai-revision' && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4 no-print">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">AI Class Review Lesson Generator</h2>
                <p className="text-xs text-slate-400 mt-0.5">Synthesizes collective errors into a structured lesson plan.</p>
              </div>

              <div className="flex gap-3">
                <select
                  value={selectedRevisionClassId}
                  onChange={(e) => setSelectedRevisionClassId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 font-bold outline-none cursor-pointer"
                >
                  {classesList.map(cl => (
                    <option key={cl.id} value={cl.id}>Class {cl.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleGenerateRevision}
                  disabled={revisionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 border border-indigo-400/20 text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {revisionLoading ? 'Analyzing & Writing...' : 'Generate Plan ➔'}
                </button>
              </div>
            </div>

            {/* Revision Results */}
            {revisionLoading && (
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3">
                <span className="w-8 h-8 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Pedagogical Review Engine</span>
                <p className="text-xs text-slate-400">Reviewing class test answers and scripting warmups...</p>
              </div>
            )}

            {!revisionLoading && revisionReport && (
              <div className="space-y-4 animate-scaleUp">
                <div className="flex justify-end no-print">
                  <button
                    onClick={triggerPrint}
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs py-1.5 px-4 rounded-lg cursor-pointer"
                  >
                    🖨️ Print Lesson Plan
                  </button>
                </div>

                <div className="p-6 bg-slate-950/50 border border-slate-850 rounded-2xl text-slate-200 leading-relaxed font-sans text-sm max-h-[600px] overflow-y-auto whitespace-pre-wrap select-text selection:bg-indigo-500/30 print:max-h-none print:overflow-visible print:bg-transparent print:border-none print:p-0">
                  {revisionReport}
                </div>
              </div>
            )}

            {!revisionLoading && !revisionReport && (
              <div className="bg-slate-950/20 border border-slate-850 border-dashed rounded-2xl p-8 text-center text-slate-500 text-xs">
                💡 Click "Generate Plan" above to analyze mistakes for Class {classesList.find(c => c.id === selectedRevisionClassId)?.name || ''} and render a lesson draft.
              </div>
            )}

          </section>
        )}

        {/* 4. REGISTERED PUPILS MANAGEMENT */}
        {activeTab === 'pupils' && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">Pupil Accounts Directory</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage passwords, rosters, and profiles.</p>
              </div>

              {/* Roster filter actions */}
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search student..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
                />

                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 font-bold outline-none cursor-pointer"
                >
                  <option value="ALL">All Classes</option>
                  {classesList.map(cl => (
                    <option key={cl.id} value={cl.id}>Class {cl.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">No students match your filter settings.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-sm select-none">{st.avatar_emoji}</span>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white max-w-[130px] truncate">{st.username}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Class:</span>
                          <select
                            value={st.class_id || ''}
                            onChange={(e) => handleAssignStudentClass(st.id, e.target.value || null)}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-indigo-300 font-bold outline-none cursor-pointer focus:border-indigo-500"
                          >
                            <option value="">Unassigned</option>
                            {classesList.map(cl => (
                              <option key={cl.id} value={cl.id}>{cl.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href={`/teacher/reports/${st.id}`}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold py-1.5 px-3 rounded-lg text-indigo-400"
                      >
                        Report
                      </Link>
                      
                      <button
                        onClick={() => handleResetPassword(st.id, st.username)}
                        className="bg-slate-900 hover:bg-red-950/20 text-[10px] text-slate-400 hover:text-red-300 font-bold border border-slate-800 hover:border-red-500/20 py-1.5 px-3 rounded-lg cursor-pointer"
                      >
                        Reset PW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5. PENDING STAFF APPROVALS (For Teachers) */}
        {activeTab === 'pending' && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">Pending Staff Activations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Authorise registrations for teacher accounts to ensure database access control.</p>
            </div>

            {pendings.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No pending registrations waiting approval.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendings.map((pending) => (
                  <div
                    key={pending.id}
                    className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none">{pending.avatar_emoji}</span>
                      <span className="text-sm font-bold text-white">{pending.username}</span>
                    </div>

                    <button
                      onClick={() => handleApproveTeacher(pending.id, pending.username)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-4 rounded-xl border border-indigo-400/20 transition-all cursor-pointer"
                    >
                      Approve Account
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5.5 CUSTOM WORKSHEETS MANAGEMENT TAB */}
        {activeTab === 'worksheets' && (
          <WorksheetsTab displayMessage={displayMessage} />
        )}

        {/* 6. ADMIN PANEL (For Admins - Backups & Staff Activations) */}
        {activeTab === 'admin' && (
          <div className="space-y-8 animate-scaleUp">
            
            {/* System Backup card */}
            <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase">System Backups</h3>
                <p className="text-xs text-slate-400 mt-0.5">Download a compressed ZIP archive containing the SQLite database and all uploaded audio/video files.</p>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Full Backup Downloader</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Contains: dev.db database state, classes, student attempts, badges, transcripts, and media files.</p>
                </div>

                <a
                  href="/api/admin/backup"
                  target="_blank"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl border border-indigo-500/25 transition-all text-center cursor-pointer shadow-md inline-block"
                >
                  📥 Download Full Backup ZIP
                </a>
              </div>
            </section>

            {/* Pending Staff activations in Admin Panel */}
            <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase">Pending Staff Registrations</h3>
                <p className="text-xs text-slate-400 mt-0.5">Authorise registrations for teacher accounts to grant access to the teacher dashboards.</p>
              </div>

              {pendings.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">No pending registrations waiting approval.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendings.map((pending) => (
                    <div
                      key={pending.id}
                      className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl select-none">{pending.avatar_emoji}</span>
                        <span className="text-sm font-bold text-white">{pending.username}</span>
                      </div>

                      <button
                        onClick={() => handleApproveTeacher(pending.id, pending.username)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-4 rounded-xl border border-indigo-400/20 transition-all cursor-pointer"
                      >
                        Approve Account
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}

        {/* 7. CLASSES & ROSTER MANAGEMENT TAB */}
        {activeTab === 'classes' && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-scaleUp">
            <div className="border-b border-slate-800/80 pb-4">
              <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">Class & Staff Administration</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage classes, assign teachers, and allocate student rosters.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Manage Classes (CRUD) */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1">School Classes</h3>
                  <p className="text-[11px] text-slate-500">Create new classrooms, rename them, or delete them.</p>
                </div>

                <form onSubmit={handleCreateClass} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New class name (e.g. 5A, Beginner)..."
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-2 px-4 rounded-xl border border-indigo-500/20 transition-all shadow-md cursor-pointer"
                  >
                    + Add Class
                  </button>
                </form>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {classesList.length === 0 ? (
                    <p className="text-slate-500 text-xs italic py-4">No classes created yet.</p>
                  ) : (
                    classesList.map((cl) => (
                      <div
                        key={cl.id}
                        className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                      >
                        {editingClassId === cl.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingClassName}
                              onChange={(e) => setEditingClassName(e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameClass(cl.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1 px-3 rounded-lg border border-emerald-500/20 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingClassId(null);
                                setEditingClassName('');
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-[10px] py-1 px-3 rounded-lg border border-slate-700 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="text-sm font-bold text-white">Class {cl.name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                {students.filter(s => s.class_id === cl.id).length} pupil(s) enrolled
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingClassId(cl.id);
                                  setEditingClassName(cl.name);
                                }}
                                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] text-indigo-400 font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteClass(cl.id, cl.name)}
                                className="bg-slate-900 hover:bg-red-950/20 hover:border-red-500/20 text-[10px] text-slate-400 hover:text-red-300 font-bold border border-slate-800 py-1.5 px-3 rounded-lg cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Teacher Class Assignments */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1">Academic Staff Assignments</h3>
                  <p className="text-[11px] text-slate-500">Bind administrators and teachers to specific school classes.</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {staffList.length === 0 ? (
                    <p className="text-slate-500 text-xs italic py-4">No staff members found.</p>
                  ) : (
                    staffList.map((st) => (
                      <div
                        key={st.id}
                        className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl filter drop-shadow-sm select-none">{st.avatar_emoji}</span>
                          <div>
                            <div className="text-sm font-bold text-white">{st.username}</div>
                            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                              {st.role}
                            </div>
                          </div>
                        </div>

                        <div>
                          <select
                            value={st.class_id || ''}
                            onChange={(e) => handleAssignStaffClass(st.id, e.target.value || null)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none cursor-pointer focus:border-indigo-500"
                          >
                            <option value="">Unassigned</option>
                            {classesList.map(cl => (
                              <option key={cl.id} value={cl.id}>Class {cl.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* PWA Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto no-print">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
