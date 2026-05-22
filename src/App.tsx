/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, BrainCircuit, X, MessageSquareCode, 
  Send, Plus, CheckCircle2, Award, Zap, Heart, Bot, RefreshCw 
} from 'lucide-react';

import SplashScreen from './components/SplashScreen';
import BottomNavbar from './components/BottomNavbar';
import HomeTab from './components/HomeTab';
import FocusTab from './components/FocusTab';
import CalendarTab from './components/CalendarTab';
import MusicTab from './components/MusicTab';
import ProfileTab from './components/ProfileTab';
import AITab from './components/AITab';

import { AppTab, CalendarEvent, SongTrack, Achievement, FocusStreak } from './types';

export default function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [userAuraTheme, setUserAuraTheme] = useState<'cyan' | 'purple' | 'emerald' | 'pink'>('cyan');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<string>('night');

  // Load appropriate theme mode based on local clock and shuffle on mount
  useEffect(() => {
    const hour = new Date().getHours();
    let clockTheme = 'night';
    if (hour >= 5 && hour < 12) {
      clockTheme = 'morning';
    } else if (hour >= 12 && hour < 17) {
      clockTheme = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      clockTheme = 'evening';
    } else {
      clockTheme = 'night';
    }
    
    // Choose an initial random offset for extra aesthetic discovery
    const aesthetics = ['cyberpunk', 'glass', 'minimal', clockTheme];
    const picked = aesthetics[Math.floor(Math.random() * aesthetics.length)];
    setThemeId(picked);
  }, []);

  const shuffleTheme = () => {
    const modes = ['morning', 'afternoon', 'evening', 'night', 'cyberpunk', 'minimal', 'glass'];
    const currentIdx = modes.indexOf(themeId);
    let targetIdx = Math.floor(Math.random() * modes.length);
    while (targetIdx === currentIdx) {
      targetIdx = Math.floor(Math.random() * modes.length);
    }
    const nextMode = modes[targetIdx];
    setThemeId(nextMode);
    triggerToast(`Aesthetic Shuffled: ${nextMode.toUpperCase()} Mode activated! 🪄✨`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };

  // Core Streaks and statistics state
  const [streak, setStreak] = useState(5);
  const [focusMinutes, setFocusMinutes] = useState(45);
  const [completedSessions, setCompletedSessions] = useState(3);

  // Calendar events pre-populated state
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'event-1',
      title: 'Revise Trigonometry Formulas & cheat sheet',
      date: '2026-05-20',
      type: 'task',
      completed: false,
      time: '10:30',
      notes: 'Study trigonometric identities & solve 5 board proof questions'
    },
    {
      id: 'event-2',
      title: 'Practice Science Metal & Non-Metals MCQ paper',
      date: '2026-05-20',
      type: 'goal',
      completed: true,
      time: '14:00',
      notes: 'Check real-time quiz inside subjects desk'
    },
    {
      id: 'event-3',
      title: 'CBSE SST Timeline Map Work revision',
      date: '2026-05-19',
      type: 'exam',
      completed: true,
      time: '09:00',
      notes: 'Focus on Indian National Movement & Congress Sessions'
    },
    {
      id: 'event-4',
      title: 'Solve English Class 10 Board Letter writing sample',
      date: '2026-05-21',
      type: 'reminder',
      completed: false,
      time: '16:00',
      notes: 'Use formal format templates from the Notes desk'
    }
  ]);

  // Playlist pre-populated tracks state
  const [songs, setSongs] = useState<SongTrack[]>([
    { id: 'track-1', title: 'Late Night Chill Lo-Fi', artist: 'Study Lofi Beats', duration: 184, coverGradient: 'from-blue-500 to-cyan-500', category: 'lofi' },
    { id: 'track-2', title: 'Rainy Cafe Study Session', artist: 'Hologram Beats Lab', duration: 142, coverGradient: 'from-purple-500 to-pink-500', category: 'lofi' },
    { id: 'track-3', title: 'Mellow Afternoon Ambient', artist: 'Nebula Sounds', duration: 210, coverGradient: 'from-pink-500 to-rose-400', category: 'ambient' },
    { id: 'track-4', title: 'Dynamic Focus Rhythm', artist: 'Cognitive Synth', duration: 195, coverGradient: 'from-[#0ea5e9] to-[#8b5cf6]', category: 'ambient' }
  ]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlayingSong, setIsPlayingSong] = useState(false);

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'ach-1', title: 'Study Starter', description: 'Log your first completed Pomodoro focus block today.', unlocked: true, icon: 'Zap' },
    { id: 'ach-2', title: 'Steady Grind', description: 'Maintain an active 5-Day productive streak.', unlocked: true, icon: 'Award' },
    { id: 'ach-3', title: 'Focus Champion', description: 'Exceed 100+ minutes of total study time.', unlocked: false, icon: 'Sparkles' },
    { id: 'ach-4', title: 'Task Crusher', description: 'Complete 5 daily action goals in your study calendar.', unlocked: false, icon: 'CheckCircle2' }
  ]);

  // AI Sentinel Assistant dialog state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMood, setAiMood] = useState<'neutral' | 'anxious' | 'stuck' | 'tired' | 'distracted'>('neutral');
  const [aiUserPrompt, setAiUserPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<{ message: string; suggestions: string[]; source?: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Auto scroll music progress or perform background ticks if helpful
  const activeSong = songs[currentSongIndex];

  // Global methods
  const handleAddSong = (newSong: Omit<SongTrack, 'id'>) => {
    const song: SongTrack = {
      ...newSong,
      id: `track-${Date.now()}`
    };
    setSongs(prev => [...prev, song]);
  };
  const handleAddEvent = (event: Omit<CalendarEvent, 'id' | 'completed'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Math.random().toString(36).substring(7)}`,
      completed: false
    };
    setEvents(prev => [newEvent, ...prev]);
    checkAchievementsCount();
  };

  const handleToggleEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
    checkAchievementsCount();
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleIncrementFocusMinutes = (mins: number) => {
    setFocusMinutes(prev => {
      const updated = prev + mins;
      // Unlock "Savant Mode" if focus time is exceeded
      if (updated >= 100) {
        setAchievements(ach => ach.map(a => a.id === 'ach-3' ? { ...a, unlocked: true } : a));
      }
      return updated;
    });
  };

  const handleIncrementCompletedSessions = () => {
    setCompletedSessions(prev => prev + 1);
    setStreak(prev => prev + 1);
  };

  const checkAchievementsCount = () => {
    // Check if 5 objectives completed
    const completedCount = events.filter(e => e.completed).length;
    if (completedCount >= 5) {
      setAchievements(ach => ach.map(a => a.id === 'ach-4' ? { ...a, unlocked: true } : a));
    }
  };

  // Chatbot Sentinel API interaction
  const triggerAIAssistant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: aiMood,
          customPrompt: aiUserPrompt || undefined,
          focusMinutes: focusMinutes,
          activeTask: events.find(ev => !ev.completed)?.title || ''
        })
      });

      const data = await res.json();
      if (data) {
        setAiResponse({
          message: data.message,
          suggestions: data.suggestions || [],
          source: data.source
        });
        setAiUserPrompt('');
      }
    } catch (err) {
      console.error('Failed to query Sentinel Assistant core:', err);
      setAiResponse({
        message: 'The neural synchronizer has encountered minor drift, but my internal circuits advising calm remain absolute. Close the door to outer static and focus on your immediate breath.',
        suggestions: [
          'Take a slow deep breath for 5 seconds.',
          'Start a 25-minute Pomodoro core focus module.',
          'Identify your single primary objective on the calendar.'
        ]
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Convert AI generated advice suggestions directly into Calendar goals
  const handleAcceptAISuggestion = (suggestionText: string) => {
    handleAddEvent({
      title: `AI: ${suggestionText}`,
      date: '2026-05-20',
      type: 'goal',
      notes: 'Formulated via AuraOS Sentinel guide core'
    });
    triggerToast(`Objective integrated into Calendar: "${suggestionText}"`);
  };

  // Choose correct theme specifications
  const themeDetails = {
    morning: {
      name: 'Sunrise Mode 🌅',
      bgOuter: 'from-amber-100 via-rose-50 to-sky-100',
      containerBg: 'bg-gradient-to-br from-[#fffbeb]/90 via-[#fff1f2]/90 to-white/95 text-slate-900 border-rose-300/40 shadow-rose-100/30',
      activeGlow: 'from-amber-400 via-rose-300/40 to-transparent',
      textBase: 'text-slate-800',
      textMute: 'text-slate-500',
      accentColor: 'text-rose-600',
      indicatorColor: 'bg-rose-500',
      brandSymbol: 'bg-rose-500',
    },
    afternoon: {
      name: 'Focus Mode 💙',
      bgOuter: 'from-blue-50/50 via-indigo-50/30 to-slate-100',
      containerBg: 'bg-[#f8fafc]/95 text-slate-900 border-indigo-200/80 shadow-indigo-100/50',
      activeGlow: 'from-blue-400 via-indigo-300/30 to-transparent',
      textBase: 'text-slate-900',
      textMute: 'text-slate-600',
      accentColor: 'text-indigo-600',
      indicatorColor: 'bg-indigo-600',
      brandSymbol: 'bg-indigo-600',
    },
    evening: {
      name: 'Energy Vibe ⚡',
      bgOuter: 'from-purple-950 via-rose-950 to-orange-950',
      containerBg: 'bg-gradient-to-br from-[#120024]/90 via-[#270020]/90 to-[#1c0800]/95 text-slate-100 border-orange-500/30 shadow-orange-950/30',
      activeGlow: 'from-amber-500 via-orange-500 to-transparent',
      textBase: 'text-slate-100',
      textMute: 'text-slate-400',
      accentColor: 'text-amber-400',
      indicatorColor: 'bg-amber-400',
      brandSymbol: 'bg-amber-500',
    },
    night: {
      name: 'Night Deep 🌌',
      bgOuter: 'from-[#010413] via-[#020518] to-black',
      containerBg: 'bg-gradient-to-br from-[#020617]/95 via-[#0c1232]/95 to-slate-950/98 text-slate-100 border-white/10 shadow-black',
      activeGlow: 'from-cyan-500/20 to-[#0c1533]',
      textBase: 'text-[#f1f5f9]',
      textMute: 'text-slate-400',
      accentColor: 'text-cyan-400',
      indicatorColor: 'bg-cyan-400',
      brandSymbol: 'bg-cyan-500',
    },
    cyberpunk: {
      name: 'Cyberpunk Universe 🦾',
      bgOuter: 'from-[#0c001c] via-[#140029] to-black',
      containerBg: 'bg-[#0f0022]/95 border-fuchsia-500/30 text-slate-100 shadow-[0_0_30px_rgba(217,70,239,0.15)]',
      activeGlow: 'from-fuchsia-500 via-pink-500 to-transparent',
      textBase: 'text-slate-100',
      textMute: 'text-slate-400',
      accentColor: 'text-fuchsia-400',
      indicatorColor: 'bg-fuchsia-500',
      brandSymbol: 'bg-[#d946ef]',
    },
    minimal: {
      name: 'Minimal Editorial 📰',
      bgOuter: 'from-slate-50 to-slate-100',
      containerBg: 'bg-white text-slate-950 border-slate-200 shadow-sm',
      activeGlow: 'from-slate-200 to-transparent',
      textBase: 'text-slate-900',
      textMute: 'text-slate-500',
      accentColor: 'text-slate-900',
      indicatorColor: 'bg-slate-800',
      brandSymbol: 'bg-slate-800',
    },
    glass: {
      name: 'Aesthetic Hologram 🔮',
      bgOuter: 'from-slate-900 via-[#1b1c4b]/40 to-slate-950',
      containerBg: 'bg-white/10 backdrop-blur-3xl border border-white/20 text-white shadow-2xl',
      activeGlow: 'from-purple-500/30 via-indigo-500/30 to-transparent',
      textBase: 'text-white',
      textMute: 'text-slate-300',
      accentColor: 'text-indigo-300',
      indicatorColor: 'bg-indigo-400',
      brandSymbol: 'bg-purple-500',
    }
  }[themeId] || {
    name: 'Night Deep 🌌',
    bgOuter: 'from-[#010413] via-[#020518] to-black',
    containerBg: 'bg-[#020617]/95 text-slate-100 border-white/10 shadow-black',
    activeGlow: 'from-cyan-500/20 to-[#0e172a]',
    textBase: 'text-[#f1f5f9]',
    textMute: 'text-slate-400',
    accentColor: 'text-cyan-400',
    indicatorColor: 'bg-cyan-400',
    brandSymbol: 'bg-cyan-500',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-tr ${themeDetails.bgOuter} flex items-center justify-center p-0 sm:p-6 md:p-10 select-none relative overflow-hidden transition-all duration-1000`}>
      {/* Background Atmospheric Lighting from Design theme */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isBooted ? (
          <SplashScreen key="splash" onComplete={() => setIsBooted(true)} />
        ) : (
          /* PREMIUM DEV SHELL CARD MOCKUP WITH AMBIENT BACKROUND NEBULAS */
          <motion.div
            key="app_core"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={themeDetails.containerBg}
            style={{
              boxShadow: '0 30px 100px rgba(0,0,0,0.85), 0 0 50px rgba(37,99,235,0.1)'
            }}
          >
            {/* Cinematic background fluid dust color */}
            <div className={`absolute top-0 right-[-100px] w-[300px] h-[300px] bg-gradient-to-l ${themeDetails.activeGlow} rounded-full blur-[90px] pointer-events-none transition-all duration-1000`} />
            <div className="absolute bottom-1/3 left-[-150px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* FLOATING GLASS NOTIFICATION BANNER */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -25, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -25, scale: 0.95 }}
                  className="absolute top-16 left-4 right-4 z-50 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 px-4 py-3 shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-sans text-white/95 font-medium leading-normal">{toastMessage}</p>
                  </div>
                  <button 
                    id="btn_dismiss_toast"
                    onClick={() => setToastMessage(null)}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* UPPER CORE STATUS BAR OR WINDOW HEADER */}
            <div className="relative pt-4 px-5 pb-2 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between z-30">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
                <motion.div 
                  className={`w-2.5 h-2.5 rounded-full ${themeDetails.indicatorColor}`}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <span className="text-xs font-mono tracking-widest font-extrabold uppercase">
                  STUDY<span className="text-amber-400">SPHERE X</span>
                </span>
                <button
                  id="btn_wand_theme_cycle"
                  onClick={(e) => {
                    e.stopPropagation();
                    shuffleTheme();
                  }}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs border border-white/10 transition-all hover:scale-105"
                  title="Cycle aesthetic theme 🪄"
                >
                  🪄
                </button>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-mono">
                <span className="text-[10px] hidden sm:inline">{themeDetails.name}</span>
                <span>•</span>
                <span 
                  onClick={shuffleTheme}
                  className="text-amber-400 font-bold bg-[#1e1b4b]/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-amber-500/10 active:scale-95 transition-all text-[8px]"
                >
                  SHUFFLE 🌌
                </span>
              </div>
            </div>

            {/* CONTENT MODULE SCROLLER FRAME */}
            <div className="flex-1 overflow-y-auto scrollbar-none pb-24 relative z-10 select-none">
              <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                  <HomeTab
                    key="home"
                    onTabChange={setActiveTab}
                    focusMinutes={focusMinutes}
                    streak={streak}
                    events={events}
                    onToggleEvent={handleToggleEvent}
                    activeSong={isPlayingSong ? { ...activeSong, isPlaying: isPlayingSong } : null}
                    onTogglePlaySong={() => setIsPlayingSong(!isPlayingSong)}
                  />
                )}
                {activeTab === 'focus' && (
                  <FocusTab
                    key="focus"
                    streak={streak}
                    onIncrementFocusMinutes={handleIncrementFocusMinutes}
                    onIncrementCompletedSessions={handleIncrementCompletedSessions}
                    onShowNotification={triggerToast}
                  />
                )}
                {activeTab === 'calendar' && (
                  <CalendarTab
                    key="calendar"
                    events={events}
                    onAddEvent={handleAddEvent}
                    onToggleEvent={handleToggleEvent}
                    onDeleteEvent={handleDeleteEvent}
                  />
                )}
                {activeTab === 'music' && (
                  <MusicTab
                    key="music"
                    songs={songs}
                    currentSongIndex={currentSongIndex}
                    onSelectSong={setCurrentSongIndex}
                    isPlaying={isPlayingSong}
                    onTogglePlay={() => setIsPlayingSong(!isPlayingSong)}
                    onAddSong={handleAddSong}
                  />
                )}
                {activeTab === 'ai' && (
                  <AITab
                    key="ai"
                    focusMinutes={focusMinutes}
                    streak={streak}
                    onTabChange={setActiveTab}
                    themeId={themeId}
                  />
                )}
                {activeTab === 'profile' && (
                  <ProfileTab
                    key="profile"
                    streakState={{
                      current: streak,
                      best: Math.max(streak, 7),
                      totalFocusTime: focusMinutes,
                      completedSessions: completedSessions
                    }}
                    achievements={achievements}
                    userName="Aria Chen"
                    userAuraTheme={userAuraTheme}
                    onChangeAuraTheme={setUserAuraTheme}
                    themeId={themeId}
                    onChangeThemeId={setThemeId}
                    onShuffleTheme={shuffleTheme}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* FLOATING GLASS NAVIGATION BAR */}
            <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* FLOATING COGNITIVE AI SENTINEL CHATBOT ORB BUTTON */}
            <div className="fixed sm:absolute bottom-24 right-6 z-40 select-none">
              <motion.button
                id="btn_active_ai_orb"
                onClick={() => setAiOpen(true)}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer relative shadow-lg ${
                  userAuraTheme === 'cyan' ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-cyan-500/20' :
                  userAuraTheme === 'purple' ? 'bg-purple-500/20 border border-purple-400/50 shadow-purple-500/20' :
                  userAuraTheme === 'emerald' ? 'bg-emerald-500/20 border border-emerald-400/50 shadow-emerald-500/20' :
                  'bg-pink-500/20 border border-pink-400/50 shadow-pink-500/20'
                }`}
                animate={{
                  y: [0, -6, 0],
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 10px 15px rgba(0,0,0,0.5), 0 0 15px rgba(34,211,238,0.2)',
                    '0 10px 15px rgba(0,0,0,0.5), 0 0 25px rgba(34,211,238,0.4)',
                    '0 10px 15px rgba(0,0,0,0.5), 0 0 15px rgba(34,211,238,0.2)'
                  ]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {/* Internal dynamic pulsing sphere core */}
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping Absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300" />
                </span>

                <BrainCircuit className="absolute w-5 h-5 text-white opacity-40 hover:opacity-100 transition-all pointer-events-none" />
              </motion.button>
            </div>

            {/* AI STUDY COACH EXPANSIVE DRAWER */}
            <AnimatePresence>
              {aiOpen && (
                <motion.div
                  className="absolute inset-0 bg-[#060815]/95 backdrop-blur-xl z-50 flex flex-col"
                  initial={{ y: '100%' }}
                  animate={{ y: '0%' }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                >
                  {/* Assistant Drawer Header */}
                  <div className="p-5 border-b border-white/5 bg-[#0a0d20]/90 backdrop-blur-md flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-sans font-bold text-white leading-none">Aura AI Study Coach</h3>
                        <p className="text-[9px] font-mono tracking-widest text-[#22d3ee] uppercase mt-1">PERSONAL STUDY ASSISTANT</p>
                      </div>
                    </div>

                    <button
                      id="btn_close_ai_drawer"
                      onClick={() => setAiOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Assistant Main Chat Workspace */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none">
                    {/* Welcome message */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/20">
                      <p className="text-xs font-sans text-slate-300 leading-relaxed font-light">
                        Greetings, student! I am your Aura AI Study Coach. Share what study topics or focus barriers you run into today, and I will recommend specific real-world actions for your schedule.
                      </p>
                    </div>

                    {/* SELECT Emotional Cortex Mood */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">STUDY MOOD</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: 'neutral' as const, label: 'Steady' },
                          { id: 'anxious' as const, label: 'Anxious' },
                          { id: 'stuck' as const, label: 'Stuck' },
                          { id: 'tired' as const, label: 'Tired' },
                          { id: 'distracted' as const, label: 'Drift' }
                        ].map(m => (
                          <button
                            id={`ai_mood_chip_${m.id}`}
                            key={m.id}
                            onClick={() => setAiMood(m.id)}
                            className={`py-2 rounded-lg text-[9.5px] font-mono border transition-all cursor-pointer ${
                              aiMood === m.id
                                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                                : 'bg-white/3 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Prompt Query Field */}
                    <form onSubmit={triggerAIAssistant} className="space-y-2 flex gap-2">
                       <input
                        id="input_ai_prompt"
                        type="text"
                        placeholder="What are you studying or struggling with?"
                        value={aiUserPrompt}
                        onChange={(e) => setAiUserPrompt(e.target.value)}
                        className="flex-1 bg-white/5 text-slate-200 placeholder-slate-500 border border-white/5 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-cyan-500 outline-none font-sans"
                        disabled={aiLoading}
                      />
                      <button
                        id="btn_send_ai_prompt"
                        type="submit"
                        disabled={aiLoading || !aiUserPrompt.trim()}
                        className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-4.5 h-4.5" />
                      </button>
                    </form>

                    {/* Output results area */}
                    <AnimatePresence>
                      {aiLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="py-12 flex flex-col items-center justify-center gap-3"
                        >
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <motion.div 
                              className="absolute inset-0 border-2 rounded-full border-cyan-500 border-t-transparent"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
                          </div>
                          <p className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">PLANNING ACTIONABLE TASKS...</p>
                        </motion.div>
                      )}

                      {aiResponse && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 pt-2"
                        >
                          {/* Main Healing Text advice */}
                          <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                            <span className="text-[8px] font-mono text-cyan-400 tracking-widest uppercase mb-1 block">STUDY COACH ADVICE</span>
                            <p className="text-xs font-sans text-slate-300 leading-relaxed font-light italic">
                              &ldquo;{aiResponse.message}&rdquo;
                            </p>
                          </div>

                          {/* Suggested Action coordinates */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono tracking-widest text-[#22d3ee] font-bold uppercase block">RECOMMENDED STUDY TASKS</label>
                            <div className="space-y-2.5">
                              {aiResponse.suggestions.map((s, sIdx) => (
                                <div
                                  id={`ai_suggestion_box_${sIdx}`}
                                  key={`suggestion-${sIdx}`}
                                  className="p-3 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between"
                                >
                                  <p className="text-xs font-sans text-slate-100 font-medium leading-tight mr-4">
                                    {s}
                                  </p>
                                  <button
                                    id={`btn_accept_ai_suggestion_${sIdx}`}
                                    onClick={() => handleAcceptAISuggestion(s)}
                                    className="px-3 py-1.5 rounded-xl border border-teal-500/20 text-[9px] font-mono uppercase text-teal-400 hover:text-white hover:bg-teal-500/10 transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
                                  >
                                    + Schedule
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
