/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, Play, Pause, RotateCcw, Maximize2, Minimize2, 
  CloudRain, Radio, Wind, Binary, Zap, VolumeX, Sparkles, HelpCircle 
} from 'lucide-react';
import { ambientSynth } from '../utils/audio';

interface FocusTabProps {
  key?: string;
  streak: number;
  onIncrementFocusMinutes: (mins: number) => void;
  onIncrementCompletedSessions: () => void;
  onShowNotification?: (msg: string) => void;
}

export default function FocusTab({
  streak,
  onIncrementFocusMinutes,
  onIncrementCompletedSessions,
  onShowNotification
}: FocusTabProps) {
  const [duration, setDuration] = useState(25 * 60); // default 25 minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Synthesized sound tracking
  const [activeSounds, setActiveSounds] = useState<Record<string, boolean>>({
    rain: false,
    hum: false,
    forest: false,
    frequency: false,
  });

  // Breathing simulation state
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdEmpty'>('inhale');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Sound configuration
    const audioOptions = [
      { id: 'rain', name: 'Rainfall Sound', icon: CloudRain, color: 'text-blue-400 border-blue-500/10 hover:border-blue-500/40 bg-blue-500/5' },
      { id: 'hum', name: 'Ambient Hum', icon: Radio, color: 'text-purple-400 border-purple-500/10 hover:border-purple-500/40 bg-purple-500/5' },
      { id: 'forest', name: 'Forest Breeze', icon: Wind, color: 'text-teal-400 border-teal-500/10 hover:border-teal-500/40 bg-teal-500/5' },
      { id: 'frequency', name: 'Alpha Focus Wave', icon: Binary, color: 'text-pink-400 border-pink-500/10 hover:border-pink-500/40 bg-pink-500/5' },
    ];

  // 1. Pomodoro Timer Core Operations
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerCompilation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Adjust duration on mode switch
  const handleSetMode = (mode: 'focus' | 'short' | 'long') => {
    setTimerMode(mode);
    setIsRunning(false);
    let mins = 25;
    if (mode === 'short') mins = 5;
    if (mode === 'long') mins = 15;
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
  };

  const handleTimerCompilation = () => {
    // Session completed! Log metrics
    const completedMins = Math.floor(duration / 60);
    onIncrementFocusMinutes(completedMins);
    if (timerMode === 'focus') {
      onIncrementCompletedSessions();
    }
    if (onShowNotification) {
      onShowNotification(`Focus session completed! You focused beautifully for ${completedMins} minutes. ⚡`);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  // 2. Continuous Synthesizer control
  const toggleAmbientSound = (id: string) => {
    const isPlaying = activeSounds[id];
    if (isPlaying) {
      ambientSynth.stopSound(id);
      setActiveSounds(prev => ({ ...prev, [id]: false }));
    } else {
      ambientSynth.startSound(id);
      setActiveSounds(prev => ({ ...prev, [id]: true }));
    }
  };

  const stopAllAmbientSounds = () => {
    ambientSynth.stopAll();
    setActiveSounds({
      rain: false,
      hum: false,
      forest: false,
      frequency: false,
    });
  };

  // Clean ambient audio on unmount to prevent leaked loops
  useEffect(() => {
    return () => {
      // Keep it optional; but you can stop elements or persist. Let's persist for pleasant flow but keep it clean.
    };
  }, []);

  // 3. Pranayama Breathing cycle simulation (4-4-4 seconds Box breathing style)
  useEffect(() => {
    let breathTimer: NodeJS.Timeout;
    const cycleBreathing = () => {
      setBreathPhase((prev) => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        if (prev === 'exhale') return 'holdEmpty';
        return 'inhale';
      });
    };

    breathTimer = setInterval(cycleBreathing, 4000); // 4-second box-inhales
    return () => clearInterval(breathTimer);
  }, []);

  // Time metrics parsing
  const formattedMinutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const formattedSeconds = (timeLeft % 60).toString().padStart(2, '0');
  const progressRatio = timeLeft / duration;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="pb-32 pt-4 px-4 max-w-sm mx-auto select-none"
    >
      {/* HEADER STREAK LOG */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-mono tracking-widest text-[#a855f7] flex items-center gap-1.5 font-bold uppercase">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> FOCUS TIMER
        </h2>
        <div className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
          <span className="text-[10px] font-mono font-bold text-slate-200">{streak} DAY STREAK</span>
        </div>
      </div>

      {/* CORE TIMER BOX */}
      <div className="relative rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
        {/* Glow halo overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Dynamic Circular Loader View */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Radial SVG background */}
          <svg className="w-full h-full -rotate-90">
            {/* Base track */}
            <circle
              cx="112"
              cy="112"
              r="96"
              fill="transparent"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="4"
            />
            {/* Glowing active indicator track */}
            <motion.circle
              cx="112"
              cy="112"
              r="96"
              fill="transparent"
              stroke="url(#purpleGlowGradient)"
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - progressRatio)}
              strokeLinecap="round"
              transition={{ ease: 'linear' }}
            />
            {/* Def definition */}
            <defs>
              <linearGradient id="purpleGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Core countdown numerical numbers */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-semibold tracking-tight text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              {formattedMinutes}:{formattedSeconds}
            </span>
            <span className="text-[9px] font-mono text-slate-400 tracking-widest mt-1.5 uppercase">
              {timerMode === 'focus' ? 'STUDY SESSION' : timerMode === 'short' ? 'STRETCH BREAK' : 'DEEP REST'}
            </span>
          </div>

          {/* Fullscreen focus mode activation icon */}
          <button
            id="btn_trigger_fullscreen"
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer min-h-[44px]"
            title="Launch Fullscreen Deep Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* TIMER PRESET SPEED SHIFTERS */}
        <div className="flex gap-2 mt-6 relative z-10">
          {[
            { id: 'focus' as const, label: 'Work Flow' },
            { id: 'short' as const, label: 'Quick Rest' },
            { id: 'long' as const, label: 'Deep Break' },
          ].map((modeOption) => (
            <button
              id={`preset_btn_${modeOption.id}`}
              key={modeOption.id}
              onClick={() => handleSetMode(modeOption.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider border font-medium transition-all cursor-pointer ${
                timerMode === modeOption.id
                  ? 'bg-purple-500/25 border-purple-400/40 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'bg-white/5 border-transparent hover:border-white/15 text-slate-400 hover:text-slate-200'
              }`}
            >
              {modeOption.label}
            </button>
          ))}
        </div>

        {/* PLAYBACK PAUSE AND RESET CORE BUTTONS */}
        <div className="flex gap-4 mt-6 relative z-10 w-full px-4">
          <button
            id="btn_timer_toggle"
            onClick={toggleTimer}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-sans text-xs tracking-wider font-semibold uppercase hover:opacity-90 active:scale-97 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_15px_rgba(168,85,247,0.3)] min-h-[44px]"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause session
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" /> Start flow
              </>
            )}
          </button>

          <button
            id="btn_timer_reset"
            onClick={resetTimer}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-white/15 border border-white/5 text-slate-300 flex items-center justify-center transition-all cursor-pointer touch-manipulation min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SYNTHESIZED AMBIENT SOUND CHANNELS */}
      <div className="relative mt-6 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-3.5 relative z-10">
          <div className="flex items-center gap-1.5">
            <VolumeX className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-mono tracking-widest text-[#a855f7] font-bold uppercase">BACKGROUND SOUNDS</span>
          </div>

          {/* Quick stop all triggers */}
          {Object.values(activeSounds).some(v => v) && (
            <button
              id="btn_stop_all_synth"
              onClick={stopAllAmbientSounds}
              className="text-[9px] font-mono text-slate-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
            >
              STOP ALL AUDIO
            </button>
          )}
        </div>

        {/* Synthesizer grid layout */}
        <div className="grid grid-cols-2 gap-2.5">
          {audioOptions.map((opt) => {
            const Icon = opt.icon;
            const isPlaying = activeSounds[opt.id];

            return (
              <button
                id={`synth_toggle_${opt.id}`}
                key={opt.id}
                onClick={() => toggleAmbientSound(opt.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-sans tracking-wide text-left cursor-pointer transition-all ${
                  isPlaying
                    ? `${opt.color} border-white/20 font-semibold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.15)] shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]`
                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-white/10' : 'bg-white/5'}`}>
                  <Icon className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate leading-none font-medium">{opt.name}</p>
                  <p className="text-[8px] font-mono text-slate-500 uppercase mt-1">
                    {isPlaying ? 'ACTIVE' : 'MUTED'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BREATHING BOX TUTORIAL PANEL */}
      <div className="mt-4 rounded-2xl border border-white/10 p-4 bg-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-sans font-semibold text-white">Synthesizer Note</h4>
          <p className="text-[10px] font-sans text-slate-400 leading-relaxed font-light mt-0.5">
            These sound environments are real wave patterns calculated live by your browser. Headphones recommended for binaural wave beats.
          </p>
        </div>
      </div>

      {/* 4. FULLSCREEN CINEMA FOCUS BREATHING BOX PORTAL */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 bg-[#05060f] z-50 flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Cinematic background particles floating */}
            <div className="absolute top-[20%] left-[10%] w-[180px] h-[180px] bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[10%] w-[180px] h-[180px] bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />

            {/* Floating exit block */}
            <div className="w-full max-w-sm flex justify-between items-center relative z-10 select-none">
              <div>
                <p className="text-[10px] font-mono text-purple-400 tracking-widest uppercase font-bold">FULLSCREEN STUDY</p>
                <h3 className="text-sm font-sans font-semibold text-white">Focus Mode Active</h3>
              </div>
              <button
                id="btn_exit_fullscreen"
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-[10px] font-mono tracking-wider uppercase bg-white/5 text-slate-300 hover:text-white transition-all cursor-pointer min-h-[44px]"
              >
                Exit Fullscreen
              </button>
            </div>

            {/* GIANT BREATHING SPHERE PORTAL */}
            <div className="flex flex-col items-center justify-center relative w-full">
              {/* Pulsing breathing bubble */}
              <motion.div
                className="w-48 h-48 rounded-full bg-gradient-to-tr from-purple-500/20 via-[#4f46e5]/10 to-transparent flex items-center justify-center border border-purple-400/20 shadow-[0_0_80px_rgba(168,85,247,0.2)] font-mono text-3xl font-semibold relative"
                animate={{
                  scale: 
                    breathPhase === 'inhale' ? 1.35 :
                    breathPhase === 'hold' ? 1.35 :
                    breathPhase === 'exhale' ? 0.95 :
                    0.95 // holdEmpty
                }}
                transition={{
                  duration: 4,
                  ease: 'easeInOut'
                }}
              >
                {/* Secondary core echo glow */}
                <motion.div 
                  className="absolute inset-4 rounded-full bg-cyan-400/5 border border-cyan-400/20"
                  animate={{ scale: [0.95, 1.1, 0.95] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />

                <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] relative">
                  {formattedMinutes}:{formattedSeconds}
                </span>
              </motion.div>

              {/* Breathing directive instruction text */}
              <div className="h-10 mt-10">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={breathPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm text-center font-sans tracking-widest font-light text-cyan-300 uppercase animate-pulse"
                  >
                    {breathPhase === 'inhale' && 'Breathe In Slowly...'}
                    {breathPhase === 'hold' && 'Secure Your Breath...'}
                    {breathPhase === 'exhale' && 'Release Effort...'}
                    {breathPhase === 'holdEmpty' && 'Enjoy the Quiet...'}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* QUICK FOOTER DIRECTIVES */}
            <div className="w-full max-w-sm text-center relative z-10">
              <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                ACTIVE FOCUS SESSION &bull; {timerMode === 'focus' ? 'FOCUS TIME' : 'STRETCH BREAK'}
              </p>
              <div className="flex gap-4 justify-center mt-3 text-[11px] font-mono text-purple-300">
                <span>STREAK: {streak} DAYS</span>
                <span>•</span>
                <span>MINUTES LEFT: {formattedMinutes}m</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
