/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Clock, CloudSun, CheckCircle2, Circle, 
  ArrowRight, Play, ChevronRight, RefreshCw, BrainCircuit, CloudRain, Sun, Zap,
  BookOpen, Atom, Calculator, Globe, Languages, Layout, Download, Bookmark, BookMarked, Search, Award, Check, AlertCircle, Trash
} from 'lucide-react';
import { AppTab, CalendarEvent } from '../types';
import { CLASS10_SUBJECTS, GENERAL_REVISION_PAPERS, Subject, Chapter, Lecture } from '../data/class10Data';
import NotebookLMView from './NotebookLMView';

interface HomeTabProps {
  key?: string;
  onTabChange: (tab: AppTab) => void;
  focusMinutes: number;
  streak: number;
  events: CalendarEvent[];
  onToggleEvent: (id: string) => void;
  activeSong: { title: string; artist: string; isPlaying: boolean; category: string; coverGradient: string } | null;
  onTogglePlaySong: () => void;
}

export default function HomeTab({
  onTabChange,
  focusMinutes,
  streak,
  events,
  onToggleEvent,
  activeSong,
  onTogglePlaySong
}: HomeTabProps) {
  // Navigation tabs within Home: 'dashboard' | 'syllabus' | 'lectures' | 'pdfs' | 'notebooklm'
  const [innerTab, setInnerTab] = useState<'dashboard' | 'syllabus' | 'lectures' | 'pdfs' | 'notebooklm'>('dashboard');

  const [time, setTime] = useState(new Date());
  const [motivation, setMotivation] = useState('Padhai shuru karo champion, board exams are waiting! 🚀');
  const [loadingMotivation, setLoadingMotivation] = useState(false);
  const [weatherCity, setWeatherCity] = useState('Delhi, NCR');
  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'rainy' | 'cloudy'>('sunny');
  const [weatherTemp, setWeatherTemp] = useState(38); // Delhi summer temperature

  // Curriculum State Management
  const [subjects, setSubjects] = useState<Subject[]>(CLASS10_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapterForQuiz, setSelectedChapterForQuiz] = useState<Chapter | null>(null);
  
  // MCQ Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Search Notes PDFs
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [bookmarkedPapers, setBookmarkedPapers] = useState<string[]>(['pap-1']); // bookmarked paper IDs

  // Saved Lectures list State
  const [lecturesState, setLecturesState] = useState<Lecture[]>(() => 
    CLASS10_SUBJECTS.flatMap(s => s.lectures)
  );
  
  // Custom alerts
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Daily micro schedule plans that users can toggle right inside the dashboard
  const [microPlans, setMicroPlans] = useState([
    { id: 'p1', time: '09:00 AM', text: 'Revise Metal chemical reactions (Sankalp sheet)', completed: false, tag: 'Chemistry' },
    { id: 'p2', time: '11:30 AM', text: 'Practice 5 CBSE proof structures (Trigonometric ratios)', completed: true, tag: 'Maths' },
    { id: 'p3', time: '04:00 PM', text: 'Ask Sentinel AI 3 savage hard BOARD mock questions', completed: false, tag: 'Aura AI' },
    { id: 'p4', time: '07:30 PM', text: 'Listen to rainy cafe lofi beat & write SST timeline notes', completed: false, tag: 'SST History' }
  ]);

  // Upload Center simulation state variables
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 'up-1', title: 'CBSE Science Acids & Bases short revisions_Clean.pdf', subject: 'Science', size: '1.4 MB', status: 'approved' as const, author: 'Sankalp Kumar' },
    { id: 'up-2', title: 'CBSE Maths Triangle Concept Cheat Sheet.pdf', subject: 'Mathematics', size: '940 KB', status: 'pending' as const, author: 'Aria Chen (You)' }
  ]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newUploadTitle, setNewUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Science');

  const triggerLocalAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => {
      setAlertMsg(prev => prev === msg ? null : prev);
    }, 3500);
  };

  // Dynamic Clock Updating
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Desi Motivation Quotes directly
  const fetchMotivation = async (byUserAction = false) => {
    setLoadingMotivation(true);
    try {
      const url = byUserAction 
        ? `/api/gemini/multilingual-motivation?language=hinglish&tone=energetic` 
        : `/api/gemini/multilingual-motivation?language=hinglish&tone=calm`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.text) {
        setMotivation(data.text);
      }
    } catch (err) {
      console.error('Failed to translate motivation:', err);
      setMotivation('Arey aaram karne ke liye puri zindagi padi hai, abhi study tracker lagao and board crack karo! 🔥');
    } finally {
      setLoadingMotivation(false);
    }
  };

  useEffect(() => {
    fetchMotivation(false);
  }, []);

  // Format digital clock
  const timeString = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const secsString = time.toLocaleTimeString('en-US', { second: '2-digit' });
  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Calculation of Board countdown (Assuming CBSE starts Feb 15th, 2027)
  const boardExamDate = new Date('2027-02-15T09:00:00');
  const checkCountdown = () => {
    const distance = boardExamDate.getTime() - time.getTime();
    if (distance < 0) return 'Board Exams are live!';
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left for Board Exam 🧠`;
  };

  // Syllabus Completion Statistics
  const totalChapters = subjects.reduce((acc, sub) => acc + sub.chapters.length, 0);
  const completedChapters = subjects.reduce(
    (acc, sub) => acc + sub.chapters.filter(ch => ch.completed).length, 
    0
  );
  const syllabusPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  // Weak chapters calculation
  const weakChapters = subjects.flatMap(sub => 
    sub.chapters.filter(ch => ch.isWeak).map(ch => ({ ...ch, subjectName: sub.name, subjectColor: sub.color }))
  );

  const handleToggleChapterComplete = (subjectId: string, chapterId: string) => {
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => {
          if (ch.id === chapterId) {
            const nextVal = !ch.completed;
            triggerLocalAlert(`"${ch.name}" marked as ${nextVal ? 'Completed' : 'Study Pending'}!`);
            return { ...ch, completed: nextVal };
          }
          return ch;
        })
      };
    }));
  };

  const handleToggleWeakTag = (subjectId: string, chapterId: string) => {
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subjectId) return sub;
      return {
        ...sub,
        chapters: sub.chapters.map(ch => {
          if (ch.id === chapterId) {
            const nextVal = !ch.isWeak;
            triggerLocalAlert(`"${ch.name}" set to ${nextVal ? '⚠️ WEAK (Needs Study)' : '✅ SATISFACTORY'}`);
            return { ...ch, isWeak: nextVal };
          }
          return ch;
        })
      };
    }));
  };

  // Launch direct quiz
  const startChapterQuiz = (chapter: Chapter) => {
    if (!chapter.mcqs || chapter.mcqs.length === 0) {
      triggerLocalAlert("No practice MCQs in this mini syllabus file yet!");
      return;
    }
    setSelectedChapterForQuiz(chapter);
    setCurrentQuizIndex(0);
    setSelectedQuizOption(null);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const handleSelectQuizOption = (optionIndex: number) => {
    if (selectedQuizOption !== null) return; // already answered
    setSelectedQuizOption(optionIndex);
    const correctAns = selectedChapterForQuiz?.mcqs[currentQuizIndex].correctAnswer;
    if (optionIndex === correctAns) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (!selectedChapterForQuiz) return;
    setSelectedQuizOption(null);
    if (currentQuizIndex + 1 < selectedChapterForQuiz.mcqs.length) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  // Search logic for PDF notes tab
  const allPDFNotes = subjects.flatMap(sub => 
    sub.chapters.map(ch => ({
      ...ch,
      subjectName: sub.name,
      subjectColor: sub.color,
      subjectId: sub.id
    }))
  );

  const filteredPDFNotes = allPDFNotes.filter(file => 
    file.name.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
    file.notesPdfName.toLowerCase().includes(notesSearchQuery.toLowerCase()) ||
    file.subjectName.toLowerCase().includes(notesSearchQuery.toLowerCase())
  );

  // Download Simulated Handler
  const simulateNoteDownload = (fileName: string) => {
    triggerLocalAlert(`📥 Downloading handwritten PDF: "${fileName}" to local cache!`);
  };

  // Simulation of drag drop handwritten resource uploads
  const handleSimulationUpload = (fileName: string) => {
    if (uploadProgress !== null) {
      triggerLocalAlert("A file is currently undergoing cognitive Sentinel check!");
      return;
    }
    setUploadProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setUploadProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUploadProgress(null);
          const newId = `up-${Date.now()}`;
          setUploadedFiles(prev => [
            {
              id: newId,
              title: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
              subject: uploadSubject,
              size: `${(Math.random() * 2.5 + 0.5).toFixed(1)} MB`,
              status: 'pending' as const,
              author: 'Aria Chen (You)'
            },
            ...prev
          ]);
          triggerLocalAlert(`🎉 Notes submitted successfully! Click [Admin Approve] to verify upload resource!`);
        }, 500);
      }
    }, 150);
  };

  // Bookmark toggler
  const toggleBookmarkPaper = (paperId: string) => {
    setBookmarkedPapers(prev => {
      const exists = prev.includes(paperId);
      if (exists) {
        triggerLocalAlert("Sample paper removed from Bookmarks.");
        return prev.filter(p => p !== paperId);
      } else {
        triggerLocalAlert("Paper bookmarked successfully ✨");
        return [...prev, paperId];
      }
    });
  };

  // Lecture progress updater
  const handleUpdateLectureProgress = (lecId: string, currentProg: number) => {
    const nextProg = currentProg >= 100 ? 0 : Math.min(currentProg + 25, 100);
    setLecturesState(prev => prev.map(lec => {
      if (lec.id === lecId) {
        triggerLocalAlert(`Lecture progress saved: ${nextProg}% completed.`);
        return { ...lec, progress: nextProg };
      }
      return lec;
    }));
  };

  // Save / Bookmark Lecture
  const toggleSaveLecture = (lecId: string) => {
    setLecturesState(prev => prev.map(lec => {
      if (lec.id === lecId) {
        const nextSaved = !lec.saved;
        triggerLocalAlert(nextSaved ? 'Lecture saved to watchlist!' : 'Lecture removed from watchlist.');
        return { ...lec, saved: nextSaved };
      }
      return lec;
    }));
  };

  // Map iconic subject glyphs
  const getSubjectIcon = (name: string, color: string) => {
    switch (name) {
      case 'Science': return <Atom className={`w-5 h-5 ${color}`} />;
      case 'Mathematics': return <Calculator className={`w-5 h-5 ${color}`} />;
      case 'Social Science': return <Globe className={`w-5 h-5 ${color}`} />;
      case 'English Literature': return <BookOpen className={`w-5 h-5 ${color}`} />;
      case 'Hindi (Sparsh/Kshitij)': return <Languages className={`w-5 h-5 ${color}`} />;
      default: return <Layout className={`w-5 h-5 ${color}`} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="pb-32 space-y-5 pt-4 px-4 max-w-sm mx-auto select-none text-left"
    >
      {/* FLOATING SUCCESS TOAST NOTIFIER */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 w-[85%] max-w-xs z-50 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/20 px-3 py-2 text-center shadow-[0_12px_24px_rgba(0,0,0,0.6)] flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-sans text-slate-100 font-extrabold truncate">{alertMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEGMENTED TAB SELECTOR AT THE TOP FOR EXQUISITE STUDENT SPACE SAVING */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-1 flex gap-0.5 relative overflow-x-auto scrollbar-none">
        {( [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'syllabus', label: 'Subjects' },
          { id: 'notebooklm', label: 'NotebookLM 🎙️' },
          { id: 'lectures', label: 'Lectures' },
          { id: 'pdfs', label: 'Notes' }
        ] as const).map(tab => (
          <button
            id={`inner_tab_${tab.id}`}
            key={tab.id}
            onClick={() => {
              setInnerTab(tab.id);
              setSelectedSubject(null);
              setSelectedChapterForQuiz(null);
            }}
            className={`flex-1 min-w-[70px] py-1.5 rounded-xl text-[10px] font-sans font-extrabold tracking-tight transition-all cursor-pointer text-center ${
              innerTab === tab.id 
                ? 'bg-amber-500 text-slate-900 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* INNER TABS RENDER */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: DASHBOARD VIEWS */}
        {innerTab === 'dashboard' && (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* BOARD COUNTDOWN WIDGET */}
            <div className="relative rounded-[28px] bg-gradient-to-br from-red-600/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 shadow-2xl overflow-hidden">
              <div className="absolute top-1 right-2 text-[8px] font-mono tracking-widest text-red-400 font-bold uppercase animate-pulse">BOARD COUNTDOWN</div>
              <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">CLASS 10 SYLLABUS TRACKER</p>
              
              <div className="flex items-center gap-3 mt-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <Clock className="w-5 h-5 text-slate-900 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-sans font-extrabold text-white leading-tight">
                    {checkCountdown()}
                  </h4>
                  <p className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">Start Date: 15-Feb-2027 • CBSE 10th</p>
                </div>
              </div>

              {/* Syllabus completion visual state */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px] mb-1.5 font-sans">
                  <span className="text-slate-400">Class 10 Board Prep Completed:</span>
                  <span className="text-amber-400 font-bold font-mono">{syllabusPercentage}% ({completedChapters}/{totalChapters} Ch)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                  <motion.div 
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${syllabusPercentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC SHIELD & STUDY STREAK HEAT FLAME METER */}
            <div className="relative rounded-[28px] bg-gradient-to-br from-orange-600/15 via-red-500/5 to-transparent border border-red-500/25 p-5 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.15),transparent_60%)] pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-orange-400 uppercase font-black">🔥 STUDY SPHERE STREAK ENGINE</span>
                  <h4 className="text-lg font-sans font-black text-white mt-1">
                    {streak} Days Active Streak!
                  </h4>
                  <p className="text-[10px] font-sans text-slate-400 leading-tight mt-1.5">
                    Your focus is currently hot. Achieve 100% daily schedule items to trigger double multiplier.
                  </p>
                </div>

                {/* ANIMATED FLAME VECTOR GLOW */}
                <motion.div 
                  className="relative w-16 h-16 flex items-center justify-center flex-shrink-0 cursor-pointer"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => triggerLocalAlert("Aura Streak Multiplier Active! 🔥 Your mind is a laser beam today!")}
                >
                  <motion.div
                    className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                  
                  {/* Fire Flame SVG Core */}
                  <svg className="w-12 h-12 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                    <motion.path 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      animate={{
                        d: [
                          "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
                          "M16.5 15.5L12 18.9a1.998 1.998 0 01-2 0l-4.5-3.4a8 8 0 1111 0z",
                          "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      fill="url(#fireGradient)"
                    />
                    <defs>
                      <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="55%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#facc15" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Floating magic spark circles */}
                  <motion.div 
                    className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
                    animate={{ y: [-10, -50], x: [0, -10, 0], opacity: [1, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div 
                    className="absolute w-1 h-1 rounded-full bg-orange-400"
                    animate={{ y: [-5, -45], x: [5, 15, 5], opacity: [1, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }}
                  />
                </motion.div>
              </div>

              {/* Energy heat bar slider */}
              <div className="mt-3.5 space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-orange-400">
                  <span>ENERGY HEAT METER</span>
                  <span>{(60 + streak * 8)}% SATURATION</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5 flex">
                  <motion.div 
                    className="bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(60 + streak * 8, 100)}%` }}
                    transition={{ duration: 1.2 }}
                  />
                </div>
              </div>
            </div>

            {/* NEXT-GEN DAILY SCHEDULE CARD */}
            <div className="relative rounded-[28px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-xl text-left overflow-hidden">
              <div className="absolute top-0 right-0 py-1.5 px-3 rounded-bl-2xl bg-indigo-500/10 border-l border-b border-indigo-500/20 text-[8px] font-mono uppercase text-indigo-300 font-extrabold tracking-widest">
                LIVE TARGETS
              </div>
              
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-400/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-sans font-black text-white uppercase tracking-tight">Today's Study Plan</h4>
                  <p className="text-[9px] font-mono text-slate-400">AUTOMATICALLY TAILORED VIA BOARD SCHEDULE</p>
                </div>
              </div>

              {/* Micro checklist list */}
              <div className="space-y-2.5">
                {microPlans.map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => {
                      const next = microPlans.map(p => p.id === plan.id ? { ...p, completed: !p.completed } : p);
                      setMicroPlans(next);
                      const t = next.find(p => p.id === plan.id);
                      triggerLocalAlert(t?.completed ? `Completed: "${plan.text}"! Keep it up! 🚀` : `Pending task: "${plan.text}"`);
                    }}
                    className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start gap-2.5 ${
                      plan.completed 
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' 
                        : 'bg-white/5 hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <span className="mt-0.5">
                      {plan.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-white flex-shrink-0" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-indigo-400">{plan.time}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 bg-white/5 text-slate-300 rounded border border-white/5">{plan.tag}</span>
                      </div>
                      <p className={`text-[11px] font-sans text-slate-200 mt-1 select-none leading-snug font-medium break-words ${plan.completed ? 'line-through text-slate-500' : ''}`}>
                        {plan.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI MOTIVATOR MODULE */}
            <div className="relative rounded-[28px] bg-white/5 backdrop-blur-xl border border-white/10 p-4 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-[9px] font-mono tracking-widest text-[#a855f7] uppercase">Gemini Student Coach</span>
                </div>
                <button
                  id="btn_refract_motivation"
                  onClick={() => fetchMotivation(true)}
                  disabled={loadingMotivation}
                  className="p-1 rounded-md hover:bg-white/5 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingMotivation ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="min-h-[48px] flex items-center">
                <AnimatePresence mode="wait">
                  {loadingMotivation ? (
                    <div className="w-full flex justify-center py-2">
                      <div className="flex gap-1">
                        <div className="w-1 h-5 bg-purple-500/30 rounded-full animate-bounce" />
                        <div className="w-1 h-5 bg-indigo-500/30 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <div className="w-1 h-5 bg-cyan-500/30 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] font-sans text-slate-200 leading-normal italic font-medium">
                      &ldquo;{motivation}&rdquo;
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* CLASS 10 QUICK SUBJECT TILES LIST */}
            <div>
              <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase block mb-2">Board exam syllabus shortcuts</span>
              <div className="grid grid-cols-2 gap-3">
                {subjects.map(sub => {
                  const done = sub.chapters.filter(c => c.completed).length;
                  const total = sub.chapters.length;
                  const subPercent = total > 0 ? Math.round((done / total) * 100) : 0;
                  
                  return (
                    <div
                      id={`sub_card_${sub.id}`}
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubject(sub);
                        setInnerTab('syllabus');
                      }}
                      className="relative rounded-[22px] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-3.5 transition-all duration-200 cursor-pointer text-left group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-white/2 to-transparent rounded-bl-3xl pointer-events-none" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-white/3 flex items-center justify-center border border-white/5">
                          {getSubjectIcon(sub.name, sub.color)}
                        </div>
                        <span className="text-[11px] font-sans font-extrabold text-[#f1f5f9] tracking-tight group-hover:text-amber-400 transition-colors truncate">
                          {sub.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span className="text-slate-400 font-bold">{done}/{total} Chapters</span>
                        <span className="text-amber-400">{subPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-white/5">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${subPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHAPTER COMPLETION AND WEAK STATUS REPORT CARD */}
            <div className="p-4 rounded-[24px] bg-white/3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Award className="w-4 h-4 text-rose-400" />
                <span className="text-[9px] font-mono text-rose-300 tracking-widest uppercase font-bold">Weak list diagnostic</span>
              </div>
              
              {weakChapters.length === 0 ? (
                <p className="text-[11px] font-sans text-slate-400 font-light italic">Excellent! You have optimized your board concepts. No weak chapters identified currently.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-sans text-slate-400 leading-tight">These {weakChapters.length} chapters are labeled ⚠️ Weak. Practice handwritten summaries, study PDF notes, or consult AURA AI!</p>
                  <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
                    {weakChapters.map(ch => (
                      <div key={ch.id} className="p-2 rounded-xl bg-[#090b1c]/70 border border-rose-500/20 flex items-center justify-between text-[11px]">
                        <div className="min-w-0 pr-2">
                          <p className="font-extrabold text-slate-200 truncate">{ch.name}</p>
                          <span className="text-[9px] font-mono uppercase text-slate-400">{ch.subjectName}</span>
                        </div>
                        <button
                          id={`btn_weak_diagnostic_${ch.id}`}
                          onClick={() => {
                            setInnerTab('syllabus');
                            const parentSub = subjects.find(s => s.chapters.some(c => c.id === ch.id));
                            if (parentSub) setSelectedSubject(parentSub);
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[9px] font-mono text-rose-300 uppercase transition-all cursor-pointer whitespace-nowrap"
                        >
                          Remedy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BOARD EXAMS PREP CALENDAR / IMPORTANT DATES IN DASHBOARD */}
            <div className="p-4 rounded-[24px] bg-white/3 border border-white/5">
              <span className="text-[9px] font-mono text-[#22d3ee] tracking-widest uppercase block mb-1.5 font-bold">2027 Board Calendar Highlights</span>
              <div className="space-y-1.5 text-[10px] font-sans">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-200 font-bold">🔬 CBSE Science Theory Paper</span>
                  <span className="text-amber-400 font-mono">02-March-2027</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-200 font-bold">📐 Mathematics Standard/Basic</span>
                  <span className="text-amber-400 font-mono">08-March-2027</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-slate-200 font-bold">🏛️ CBSE Social Science Board</span>
                  <span className="text-amber-400 font-mono">15-March-2027</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-200 font-bold">💻 Information Technology (402)</span>
                  <span className="text-amber-400 font-mono">22-March-2027</span>
                </div>
              </div>
              <button
                id="btn_dashboard_calendar_redirect"
                onClick={() => onTabChange('calendar')}
                className="w-full mt-3 py-1.5 text-center text-[10px] font-mono uppercase text-cyan-400 hover:text-cyan-300 bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl transition-all cursor-pointer"
              >
                Launch Complete Board Planner
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 2: COMPLETE CURRICULUM & SUBJECTS */}
        {innerTab === 'syllabus' && (
          <motion.div
            key="syllabus-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Subject Overview Selector / Back to lists */}
            {!selectedSubject ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-transparent border border-white/5">
                  <p className="text-[11px] font-sans text-slate-300 leading-normal">
                    Select any Class 10 board exam subject to examine individual chapters, notes, sample mock tests, and weak tagging diagnostics.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {subjects.map(sub => {
                    const compCount = sub.chapters.filter(c => c.completed).length;
                    return (
                      <div
                        id={`syllabus_subject_list_item_${sub.id}`}
                        key={sub.id}
                        onClick={() => setSelectedSubject(sub)}
                        className="p-3.5 rounded-2xl bg-[#090b1c] hover:bg-slate-900 border border-white/5 hover:border-white/15 cursor-pointer flex items-center justify-between transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/3 flex items-center justify-center">
                            {getSubjectIcon(sub.name, sub.color)}
                          </div>
                          <div className="text-left">
                            <h4 className="text-xs font-sans font-extrabold text-[#f1f5f9] group-hover:text-amber-400 transition-colors">{sub.name}</h4>
                            <p className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">{sub.chapters.length} Chapters • Board Syllabus</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500">
                            {compCount}/{sub.chapters.length} Completed
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* INDIVIDUAL SELECTED SUBJECT DETAIL DESK */
              <div className="space-y-3">
                {/* Subject Back Nav Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                  <button
                    id="btn_syllabus_back"
                    onClick={() => {
                      setSelectedSubject(null);
                      setSelectedChapterForQuiz(null);
                    }}
                    className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center cursor-pointer min-h-[44px]"
                  >
                    &larr; BACK TO SUBJECTS
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{selectedSubject.name} SYSTEM</span>
                </div>

                {/* Subject Banner layout */}
                <div className={`p-4 rounded-3xl bg-gradient-to-r ${selectedSubject.bgGradient} border border-white/10 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                      {getSubjectIcon(selectedSubject.name, selectedSubject.color)}
                    </div>
                    <div>
                      <h3 className="text-sm font-sans font-extrabold text-white">{selectedSubject.name}</h3>
                      <p className="text-[9px] font-mono text-slate-300 uppercase leading-none mt-1">CLASS 10 SYLLABUS HUB</p>
                    </div>
                  </div>
                  <div className="bg-[#020617]/40 px-3 py-1.5 rounded-2xl border border-white/5 text-center text-xs font-mono font-bold text-amber-400">
                    {selectedSubject.chapters.filter(c => c.completed).length} / {selectedSubject.chapters.length} Ch
                  </div>
                </div>

                {/* MINI MCQ QUIZ OVERLAY FOR IN-CHART INTERACTION */}
                {selectedChapterForQuiz && (
                  <div className="p-4 rounded-[26px] bg-[#0c0e25] border border-amber-500/30 shadow-2xl relative">
                    <button
                      id="btn_close_quiz"
                      onClick={() => setSelectedChapterForQuiz(null)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-white text-xs font-mono"
                    >
                      [CLOSE QUIZ]
                    </button>
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest block mb-1">Interactive Board Quiz Practice</span>
                    <h5 className="text-xs font-sans text-slate-200 mt-1 leading-relaxed">
                      Chapter: {selectedChapterForQuiz.name}
                    </h5>

                    {!quizCompleted ? (
                      <div className="mt-3.5 space-y-3">
                        <div className="p-3 bg-slate-950 rounded-xl">
                          <p className="text-[11px] font-sans text-slate-100 font-bold leading-relaxed">
                            Q{currentQuizIndex + 1}: {selectedChapterForQuiz.mcqs[currentQuizIndex]?.question}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          {selectedChapterForQuiz.mcqs[currentQuizIndex]?.options.map((opt, oIdx) => {
                            const isSelected = selectedQuizOption === oIdx;
                            const isCorrect = oIdx === selectedChapterForQuiz.mcqs[currentQuizIndex].correctAnswer;
                            let btnBg = "bg-white/5 hover:bg-white/10 text-slate-300";
                            
                            if (selectedQuizOption !== null) {
                              if (isSelected) {
                                btnBg = isCorrect ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "bg-red-500/20 border-red-500/60 text-red-300";
                              } else if (isCorrect) {
                                btnBg = "bg-emerald-500/20 border-emerald-500/60 text-emerald-300";
                              }
                            }

                            return (
                              <button
                                key={`opt-${oIdx}`}
                                onClick={() => handleSelectQuizOption(oIdx)}
                                className={`w-full p-2.5 rounded-xl text-left text-[11px] font-sans border border-white/5 transition-all flex items-center justify-between cursor-pointer ${btnBg}`}
                              >
                                <span>{opt}</span>
                                {selectedQuizOption !== null && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {selectedQuizOption !== null && (
                          <button
                            id="btn_next_quiz_q"
                            onClick={handleNextQuizQuestion}
                            className="w-full py-2 bg-amber-500 text-slate-900 font-sans font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all mt-3 cursor-pointer"
                          >
                            <span>
                              {currentQuizIndex + 1 < selectedChapterForQuiz.mcqs.length ? "Next Question" : "See Results"}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 text-center py-2">
                        <Award className="w-8 h-8 text-amber-400 mx-auto mb-1 animate-pulse" />
                        <h6 className="text-xs font-sans font-extrabold text-white">Quiz Completed!</h6>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">Your Score: {quizScore} / {selectedChapterForQuiz.mcqs.length}</p>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 max-w-xs mx-auto mt-2">
                          <div 
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${(quizScore / selectedChapterForQuiz.mcqs.length) * 100}%` }}
                          />
                        </div>
                        <button
                          id="btn_quiz_done"
                          onClick={() => setSelectedChapterForQuiz(null)}
                          className="mt-3.5 px-4 py-1.5 bg-teal-500/25 hover:bg-teal-500/40 border border-teal-500/30 text-[10px] font-mono text-teal-300 uppercase rounded-xl transition-all cursor-pointer"
                        >
                          Finish Practice
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Syllabus chapters list inside this subject */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Class 10 Board Chapters</span>
                  {selectedSubject.chapters.map(ch => (
                    <div
                      id={`chapter_row_desc_${ch.id}`}
                      key={ch.id}
                      className="p-3.5 rounded-2xl bg-[#030615] border border-white/5 space-y-3 text-left transition-all"
                    >
                      {/* Chapter Info strip */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2">
                          <button
                            id={`btn_toggle_ch_comp_${ch.id}`}
                            onClick={() => handleToggleChapterComplete(selectedSubject.id, ch.id)}
                            className="mt-0.5"
                          >
                            {ch.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)] animate-pulse" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                            )}
                          </button>
                          <div>
                            <h4 className={`text-xs font-sans font-extrabold leading-normal ${ch.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                              {ch.name}
                            </h4>
                          </div>
                        </div>

                        {/* Weak Diagnostic tag button */}
                        <button
                          id={`btn_ch_weak_tag_${ch.id}`}
                          onClick={() => handleToggleWeakTag(selectedSubject.id, ch.id)}
                          className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold cursor-pointer flex items-center gap-0.5 ${
                            ch.isWeak 
                              ? 'bg-red-500/10 border border-red-500/30 text-rose-400' 
                              : 'bg-white/3 border border-transparent text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span>{ch.isWeak ? '⚠️ WEAK' : 'Satisfactory'}</span>
                        </button>
                      </div>

                      {/* Download PDFs & Quiz Practice Options */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <button
                          id={`btn_download_notes_pdf_${ch.id}`}
                          onClick={() => simulateNoteDownload(ch.notesPdfName)}
                          className="py-1.5 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 text-[10px] font-mono text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-slate-400" />
                          <span>PDF ({ch.notesSize})</span>
                        </button>

                        <button
                          id={`btn_practice_quiz_${ch.id}`}
                          onClick={() => startChapterQuiz(ch)}
                          className="py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/20 text-[10px] font-mono text-teal-300 hover:text-teal-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Award className="w-3 h-3 text-teal-400 animate-pulse" />
                          <span>Practice MCQs</span>
                        </button>
                      </div>

                      {/* Handwritten or Short labels highlights */}
                      <div className="flex gap-1.5 text-[8.5px] font-mono text-slate-500">
                        {ch.hasHandwritten && <span className="text-purple-400/80">• Includes Handwritten Notes</span>}
                        {ch.hasFormulas && <span className="text-cyan-400/80">• Includes Formulas Cheat Sheet</span>}
                        {ch.hasImportantQs && <span className="text-amber-400/80">• 50+ PYQs Integrated</span>}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: SMART NOTEBOOKLM DISCOURSES SYSTEM */}
        {innerTab === 'notebooklm' && (
          <motion.div
            key="notebooklm-workspace"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <NotebookLMView />
          </motion.div>
        )}

        {/* TAB 3: VIDEO LECTURES SYSTEM */}
        {innerTab === 'lectures' && (
          <motion.div
            key="lectures-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Introductory instructions banner */}
            <div className="p-4 rounded-3xl bg-[#090b1c] border border-white/5 flex justify-between items-center text-left">
              <div className="pr-4">
                <span className="text-[9px] font-mono text-orange-400 font-bold uppercase block mb-0.5">AURA LECTURES</span>
                <p className="text-[11px] font-sans text-slate-300 leading-normal">
                  Chapter-wise premium YouTube class lectures with automated speed controls & offline progress checkouts.
                </p>
              </div>
              <Bookmark className="w-8 h-8 text-orange-400/40 animate-pulse flex-shrink-0" />
            </div>

            {/* List of lectures */}
            <div className="space-y-3">
              {lecturesState.map(lec => (
                <div
                  key={lec.id}
                  className="rounded-3xl bg-[#020512] border border-white/5 p-4 space-y-3 hover:border-white/12 transition-all group"
                >
                  {/* Pseudo Video Thumbnail player bar */}
                  <div className="relative rounded-2xl bg-slate-950 aspect-video overflow-hidden flex items-center justify-center border border-white/5 group-hover:border-orange-500/20 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent pointer-events-none" />
                    
                    {/* Simulated Youtube Tag */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white font-mono text-[8px] rounded uppercase font-bold tracking-wide">
                      HD 1080P
                    </div>

                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white font-mono text-[9px] rounded font-bold">
                      {lec.duration}
                    </div>

                    {/* Central Play button */}
                    <button
                      id={`btn_play_trigger_lec_${lec.id}`}
                      onClick={() => triggerLocalAlert(`🎥 Now streaming: "${lec.title}" by ${lec.teacher} at 1.5x Premium Board mode!`)}
                      className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 group-hover:shadow-orange-500/20"
                    >
                      <Play className="w-5 h-5 fill-slate-900 text-slate-900 ml-0.5" />
                    </button>
                    
                    <span className="absolute bottom-2 left-2.5 text-[8px] font-mono text-slate-500 uppercase">{lec.views}</span>
                  </div>

                  {/* Title & Teacher metadata */}
                  <div className="text-left">
                    <span className="text-[8.5px] font-mono text-orange-400 font-bold uppercase tracking-wide">Class 10 Syllabus Video</span>
                    <h4 className="text-xs font-sans font-extrabold text-slate-100 mt-0.5 group-hover:text-orange-300 transition-colors leading-relaxed">
                      {lec.title}
                    </h4>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">Faculty Host: {lec.teacher}</p>
                  </div>

                  {/* Continuing watch & mark progress sliders */}
                  <div className="pt-2.5 border-t border-white/5">
                    <div className="flex justify-between items-center text-[10px] mb-1 font-mono text-slate-400">
                      <span>Watching Progress:</span>
                      <span className="text-orange-400 font-bold">{lec.progress}% Done</span>
                    </div>

                    <div className="w-full bg-[#030615] rounded-full h-1.5 relative overflow-hidden border border-white/5">
                      <div 
                        className="bg-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${lec.progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-2.5 pt-1">
                      <button
                        id={`btn_update_progress_${lec.id}`}
                        onClick={() => handleUpdateLectureProgress(lec.id, lec.progress)}
                        className="py-1 px-3.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[9px] font-mono text-orange-300 uppercase transition-all cursor-pointer"
                      >
                        {lec.progress === 100 ? 'Reset Progress' : 'Update Watch +25%'}
                      </button>

                      <button
                        id={`btn_lecture_save_${lec.id}`}
                        onClick={() => toggleSaveLecture(lec.id)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          lec.saved 
                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 shadow-md' 
                            : 'bg-white/3 border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 4: NOTES & PDF HUB */}
        {innerTab === 'pdfs' && (
          <motion.div
            key="pdfs-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Search Input Filter bar */}
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                id="notes_hub_search_bar"
                type="text"
                value={notesSearchQuery}
                onChange={(e) => setNotesSearchQuery(e.target.value)}
                placeholder="Search handwritten notes & board papers..."
                className="bg-transparent border-0 outline-none text-xs text-slate-100 placeholder-slate-500 flex-grow font-sans"
              />
              {notesSearchQuery && (
                <button 
                  id="btn_clear_notes_search"
                  onClick={() => setNotesSearchQuery('')}
                  className="text-xs font-mono text-slate-400 hover:text-white px-1.5 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* HIGH-FIDELITY DYNAMIC UPLOAD CENTER MODULE */}
            <div className="relative rounded-[26px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 p-5 shadow-xl text-left overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.06),transparent_60%)] pointer-events-none" />
              
              <span className="text-[8px] font-mono tracking-widest text-[#a855f7] font-extrabold uppercase block mb-1">STUDENT RESOURCE DESK</span>
              <h4 className="text-xs font-sans font-black text-white uppercase tracking-tight">📤 Peer Study Notes Upload Center</h4>
              <p className="text-[9.5px] font-sans text-slate-400 leading-snug mt-1">
                Drag-and-drop or click to upload your handwritten summaries, cheat sheets, or revision formulas. All uploads undergo automatic Sentinel AI security scanning and fast-track admin verification.
              </p>

              {/* Drag and Drop Zone Container */}
              <div 
                id="drag_drop_zone"
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const mockFiles = [
                    "CBSE_Trigonometric_Identities_Formula_Sheet.pdf", 
                    "Class10_Metal_Chemical_Properties_QuickNote.pdf", 
                    "History_National_Movement_Congress_Timeline.pdf", 
                    "Sanskrit_Grammar_Samas_RevisionSheet.pdf"
                  ];
                  const picked = mockFiles[Math.floor(Math.random() * mockFiles.length)];
                  handleSimulationUpload(picked);
                }}
                onClick={() => {
                  const testName = prompt("Enter Note file title (e.g. CBSE English formal letter layout.pdf):");
                  if (testName && testName.trim()) {
                    handleSimulationUpload(testName.trim());
                  }
                }}
                className={`mt-4 border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? "border-amber-400 bg-amber-500/10 shadow-[inset_0_0_12px_rgba(245,158,11,0.2)]" 
                    : "border-white/10 bg-white/3 hover:bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 py-1.5">
                  <span className="text-2xl animate-bounce">📥</span>
                  <p className="text-[11px] font-sans text-slate-250 font-extrabold text-white">
                    {dragActive ? "Drop file to initiate upload!" : "Click to select or drop research note here"}
                  </p>
                  <p className="text-[9px] font-mono text-slate-500">
                    PDF, JPEG, TXT up to 15MB • Automatic virus-free sync
                  </p>
                </div>
              </div>

              {/* Upload settings parameters */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[8.5px] font-mono text-slate-400 uppercase">Resource Subject</label>
                  <select 
                    id="select_upload_subject"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full mt-1 bg-slate-950 text-slate-300 border border-white/10 rounded-xl text-[10px] p-2 outline-none cursor-pointer focus:ring-1 focus:ring-amber-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="Science">🔬 Science</option>
                    <option value="Mathematics">📐 Mathematics</option>
                    <option value="Social Science">🏛️ Social Science</option>
                    <option value="English Literature">📖 English</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8.5px] font-mono text-slate-400 uppercase">AURA SECURITY MODE</label>
                  <div className="mt-2 text-[9.5px] font-mono text-[#10b981] font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SENTINEL REAL-TIME ESCORT
                  </div>
                </div>
              </div>

              {/* Custom Ticking Progress slider */}
              {uploadProgress !== null && (
                <div className="mt-4 p-3 rounded-2xl bg-slate-950/80 border border-white/5">
                  <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400 mb-1.5">
                    <span className="animate-pulse font-bold">🧠 SENTINEL AI SCANNING INTEGRITY...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 h-full transition-all duration-100"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Queue & Reviewers items list */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest font-extrabold block">Resource Queue & Verification Stream</span>
                {uploadedFiles.map(file => (
                  <div key={file.id} className="p-3 rounded-2xl bg-[#030615]/90 border border-white/5 hover:border-white/10 flex items-center justify-between text-[11px] gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-200 truncate leading-snug">{file.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[8.5px] font-mono text-slate-400">
                        <span className="uppercase text-amber-400 font-bold">{file.subject}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span className="text-indigo-300 font-bold">by {file.author}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {file.status === 'approved' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8.5px] font-mono uppercase text-emerald-400 font-black tracking-wide flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" /> Approved
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[8.5px] font-mono uppercase text-amber-400 font-black tracking-wide animate-pulse flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-400 rounded-full" /> Pending
                          </span>
                          <button
                            id={`btn_admin_approve_${file.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = uploadedFiles.map(f => f.id === file.id ? { ...f, status: 'approved' as const } : f);
                              setUploadedFiles(next);
                              triggerLocalAlert("🎉 Admin review simulated successfully! Note file has been approved and shared with CBSE peers!");
                            }}
                            className="text-[8px] font-mono font-bold text-cyan-400 hover:text-white bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/10 cursor-pointer uppercase transition-colors"
                          >
                            [Review Admin Approve]
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HIGH REVENUE HANDWRITTEN / REVISION GENERAL PAPERS (Bookmarking and Downloads Included) */}
            <div className="space-y-2 text-left">
              <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase block font-bold">Class 10 CBSE Sample & Formula papers</span>
              
              {GENERAL_REVISION_PAPERS.map(pap => {
                const isBookmarked = bookmarkedPapers.includes(pap.id);
                return (
                  <div
                    key={pap.id}
                    className="p-3.5 rounded-2xl bg-[#090b1c] border border-white/5 hover:border-white/12 flex items-center justify-between gap-3 text-left transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wide">{pap.category} ({pap.size})</span>
                      <h4 className="text-xs font-sans font-extrabold text-[#f1f5f9] mt-0.5 truncate leading-tight">
                        {pap.title}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">{pap.countDownloads} students downloaded recently</p>
                    </div>

                    <div className="flex gap-1">
                      {/* Simulated Download */}
                      <button
                        id={`btn_download_revision_${pap.id}`}
                        onClick={() => simulateNoteDownload(pap.title)}
                        className="p-2 bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
                        title="Download board PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Bookmark action */}
                      <button
                        id={`btn_bookmark_revision_${pap.id}`}
                        onClick={() => toggleBookmarkPaper(pap.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
                          isBookmarked 
                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 shadow-md' 
                            : 'bg-white/3 border border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Save to study desk"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SYLLABUS DOCK CHAPTER PDF FILES LIST */}
            <div className="space-y-2 text-left pt-2 border-t border-white/5">
              <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase block font-bold">Chapter notes checklist ({filteredPDFNotes.length} papers found)</span>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                {filteredPDFNotes.map(row => (
                  <div
                    key={row.id}
                    className="p-3 rounded-2xl bg-[#020512] border border-white/5 flex items-center justify-between text-[11px] hover:border-white/10"
                  >
                    <div className="min-w-0 pr-3 text-left">
                      <span className="text-[8px] font-mono uppercase text-slate-400">{row.subjectName} chapter notes</span>
                      <p className="font-extrabold text-slate-200 truncate leading-relaxed">{row.name}</p>
                      <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{row.notesPdfName}</p>
                    </div>

                    <button
                      id={`btn_download_sub_ch_notes_${row.id}`}
                      onClick={() => simulateNoteDownload(row.notesPdfName)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/12 border border-white/5 text-[10px] font-mono text-slate-300 uppercase transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap min-h-[38px]"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>{row.notesSize}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
