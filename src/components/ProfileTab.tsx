/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Zap, Timer, Award, CheckCircle2, ShieldAlert, 
  Settings, HelpCircle, Palette, Sparkles, Sliders, ChevronRight,
  Flame, Calendar, TrendingUp, PieChart, Users, Check
} from 'lucide-react';
import { Achievement, FocusStreak } from '../types';

interface ProfileTabProps {
  key?: string;
  streakState: FocusStreak;
  achievements: Achievement[];
  userName: string;
  userAuraTheme: 'cyan' | 'purple' | 'emerald' | 'pink';
  onChangeAuraTheme: (theme: 'cyan' | 'purple' | 'emerald' | 'pink') => void;
  themeId?: string;
  onChangeThemeId?: (themeId: string) => void;
  onShuffleTheme?: () => void;
}

export default function ProfileTab({
  streakState,
  achievements,
  userName,
  userAuraTheme,
  onChangeAuraTheme,
  themeId = 'night',
  onChangeThemeId,
  onShuffleTheme
}: ProfileTabProps) {
  // Gamified Study XP State & Leaderboard declarations
  const [userXP, setUserXP] = useState(2450);
  const [missionClaimed, setMissionClaimed] = useState(false);
  const [rewardClaiming, setRewardClaiming] = useState(false);
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Sankalp Kumar', xp: 3200, status: 'online' },
    { rank: 2, name: 'Ananya Sharma', xp: 2850, status: 'offline' },
    { rank: 3, name: 'Aria Chen (You)', xp: 2450, status: 'online' },
    { rank: 4, name: 'Shreya Iyer', xp: 2100, status: 'offline' },
    { rank: 5, name: 'Virat Sen', xp: 1950, status: 'online' }
  ]);

  const handleClaimReward = () => {
    if (missionClaimed) return;
    setRewardClaiming(true);
    setTimeout(() => {
      setUserXP(prev => prev + 150);
      setLeaderboard(prev => 
        prev.map(item => item.name.includes('(You)') ? { ...item, xp: item.xp + 150 } : item)
             .sort((a,b) => b.xp - a.xp)
             .map((item, idx) => ({ ...item, rank: idx + 1 }))
      );
      setRewardClaiming(false);
      setMissionClaimed(true);
    }, 1200);
  };

  // Mock historic data for the last 7 days
  const dailyHours = [1.2, 2.4, 0.8, 3.2, 2.0, 4.5, 3.0];
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const auraThemes = [
    { id: 'cyan' as const, name: 'Space Cyan', color: 'bg-cyan-500', glow: 'shadow-cyan-500/30', text: 'text-cyan-400' },
    { id: 'purple' as const, name: 'Cyber Purple', color: 'bg-purple-500', glow: 'shadow-purple-500/30', text: 'text-purple-400' },
    { id: 'emerald' as const, name: 'Forest Wind', color: 'bg-emerald-500', glow: 'shadow-emerald-500/30', text: 'text-emerald-400' },
    { id: 'pink' as const, name: 'Aurora Velvet', color: 'bg-pink-500', glow: 'shadow-pink-500/30', text: 'text-pink-400' },
  ];

  // SVG Coordinates for Areas Spark chart
  // mapping values to Y coords (height is 80, padding 10)
  const maxVal = Math.max(...dailyHours);
  const pointsString = dailyHours
    .map((val, idx) => {
      const x = (idx / (dailyHours.length - 1)) * 320 + 20;
      const y = 80 - (val / maxVal) * 55;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPointsString = `20,80 ${pointsString} 340,80`;

  const isLightTheme = themeId === 'morning' || themeId === 'afternoon' || themeId === 'minimal';

  const textBase = isLightTheme ? 'text-slate-800' : 'text-slate-200';
  const textTitle = isLightTheme ? 'text-slate-900' : 'text-white';
  const textMute = isLightTheme ? 'text-slate-500' : 'text-slate-400';
  const bgPanel = isLightTheme ? 'bg-white/90 border-slate-200/60 shadow-md text-slate-900' : 'bg-white/5 border-white/10 shadow-2xl text-white';
  const bgInnerPanel = isLightTheme ? 'bg-slate-100 border-slate-200/65' : 'bg-slate-950/40 border-white/5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className={`pb-32 pt-4 px-4 max-w-sm mx-auto select-none ${textBase}`}
    >
      {/* 1. FUTURISTIC BIOMETRIC AVATAR DETAILS */}
      <div className={`relative rounded-[32px] border p-6 overflow-hidden flex flex-col items-center transition-all duration-300 ${bgPanel}`}>
        {/* Glow halo behind head */}
        <div className={`absolute -top-10 w-28 h-28 rounded-full blur-2xl opacity-15 bg-gradient-to-r ${
          userAuraTheme === 'cyan' ? 'from-cyan-500 to-sky-500' :
          userAuraTheme === 'purple' ? 'from-purple-500 to-indigo-500' :
          userAuraTheme === 'emerald' ? 'from-emerald-500 to-teal-500' :
          'from-pink-500 to-rose-500'
        }`} />

        {/* Floating Ring Avatar */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Animated concentric scanning vector */}
          <motion.div
            className={`absolute inset-0 border-2 rounded-full border-dashed ${
              userAuraTheme === 'cyan' ? 'border-cyan-500/30' :
              userAuraTheme === 'purple' ? 'border-purple-500/30' :
              userAuraTheme === 'emerald' ? 'border-emerald-500/30' :
              'border-pink-500/30'
            }`}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />

          <div className={`w-18 h-18 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 flex items-center justify-center shadow-lg relative ${
            userAuraTheme === 'cyan' ? 'border-cyan-400' :
            userAuraTheme === 'purple' ? 'border-purple-400' :
            userAuraTheme === 'emerald' ? 'border-emerald-400' :
            'border-pink-400'
          }`}>
            <User className={`w-8 h-8 ${
              userAuraTheme === 'cyan' ? 'text-cyan-400' :
              userAuraTheme === 'purple' ? 'text-purple-400' :
              userAuraTheme === 'emerald' ? 'text-emerald-400' :
              'text-pink-400'
            }`} />
          </div>

          {/* Biometric rating level indicator */}
          <span className={`absolute bottom-0 right-1 text-[8px] font-mono px-1.5 py-0.5 rounded-md border text-white font-bold bg-slate-950/80 ${
            userAuraTheme === 'cyan' ? 'border-cyan-500/40 text-cyan-300' :
            userAuraTheme === 'purple' ? 'border-purple-500/40 text-purple-300' :
            userAuraTheme === 'emerald' ? 'border-emerald-500/40 text-emerald-300' :
            'border-pink-500/40 text-pink-300'
          }`}>
            LVL 4
          </span>
        </div>

        {/* User descriptor text */}
        <div className="text-center mt-4 w-full space-y-1.5">
          <h3 className={`text-base font-sans font-bold tracking-wide ${textTitle}`}>{userName}</h3>
          
          {/* XP Progression Meter */}
          <div className="max-w-[190px] mx-auto space-y-1">
            <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500">
              <span>RANK PROGRESSION</span>
              <span className="text-amber-400 font-bold">{userXP} / 3000 XP</span>
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-1.5 border border-white/5 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-400 h-full rounded-full"
                initial={{ width: "60%" }}
                animate={{ width: `${Math.min((userXP / 3000) * 100, 100)}%` }}
                transition={{ duration: 1.2 }}
              />
            </div>
          </div>
          
          <p className="text-[10px] font-mono tracking-widest text-[#22d3ee] uppercase mt-1.5">SANKALP DIVISION &bull; CLASS 10</p>
        </div>

        {/* Core Stats overview matrix */}
        <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-5 border-t border-white/5 text-center">
          <div className="p-1">
            <span className="text-xs font-mono text-slate-500 uppercase block">TOTAL FOCUS</span>
            <span className={`text-base font-mono font-bold tracking-tight mt-1 block ${textTitle}`}>
              {(streakState.totalFocusTime / 60).toFixed(1)}h
            </span>
          </div>

          <div className="p-1 border-x border-white/5">
            <span className="text-xs font-mono text-slate-500 uppercase block">STREAK</span>
            <span className="text-base font-mono font-bold text-purple-400 tracking-tight mt-1 flex items-center justify-center gap-0.5">
              <Zap className="w-3.5 h-3.5 fill-purple-400 text-purple-400 animate-pulse" /> {streakState.current}d
            </span>
          </div>

          <div className="p-1">
            <span className="text-xs font-mono text-slate-500 uppercase block">SESSIONS</span>
            <span className="text-base font-mono font-bold text-teal-400 tracking-tight mt-1 block">
              {streakState.completedSessions}
            </span>
          </div>
        </div>
      </div>

      {/* GAMIFIED WEEKLY LEADERBOARD & CLAIMABLE DAILY MISSIONS */}
      <div className={`relative mt-5 rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 z-10">
            <Users className="w-4 h-4 text-amber-500 animate-[bounce_3s_infinite]" />
            <span className="text-[10px] font-mono tracking-widest text-amber-400 font-extrabold uppercase">CBSE BATCH LEADERBOARD</span>
          </div>
          <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase">
            WEEK 3 LIVE
          </span>
        </div>

        {/* Global Competitor Rows */}
        <div className="space-y-1.5 mt-2">
          {leaderboard.map(student => {
            const isUser = student.name.includes('(You)');
            return (
              <div 
                key={student.name}
                className={`py-2 px-3 rounded-xl flex items-center justify-between text-[11px] font-sans border transition-all ${
                  isUser 
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300 font-extrabold shadow-sm"
                    : "bg-slate-950/40 border-white/5 hover:bg-slate-950/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-4 font-mono text-[10px] ${student.rank === 1 ? "text-yellow-400 font-bold" : student.rank === 2 ? "text-slate-300" : student.rank === 3 ? "text-amber-500" : "text-slate-500"}`}>
                    #{student.rank}
                  </span>
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] uppercase text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-slate-950 ${student.status === 'online' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <span className="truncate max-w-[120px]">{student.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{student.xp} XP</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Claimable Action for XP reward */}
        <div className="mt-4 pt-3.5 border-t border-white/5">
          <div className="bg-[#030614]/80 rounded-2xl border border-white/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
            <div>
              <span className="text-[8px] font-mono text-[#a855f7] uppercase font-black tracking-widest block">ACTIVE MINI MISSION</span>
              <p className="text-[10px] font-sans font-extrabold text-slate-200 mt-1">Practice Pomodoro with ambient synth</p>
              <p className="text-[8.5px] font-mono text-slate-500">Unlocks +150 Board Rank XP coins</p>
            </div>

            <button
              id="btn_claim_mission_xp"
              disabled={missionClaimed || rewardClaiming}
              onClick={handleClaimReward}
              className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all ${
                missionClaimed 
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : rewardClaiming 
                    ? "bg-amber-500/10 border border-amber-500/20 text-white animate-pulse"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-500/40 text-slate-950 hover:opacity-90 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              }`}
            >
              {missionClaimed ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3px]" /> CLAIMED
                </>
              ) : rewardClaiming ? (
                "Verifying..."
              ) : (
                "Claim +150 XP"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. CUSTOMIZABLE ACTIVE AURA CUSTOMIZER */}
      <div className={`relative mt-5 rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-1.5 mb-3.5 relative z-10">
          <Palette className={`w-4 h-4 ${
            userAuraTheme === 'cyan' ? 'text-cyan-400' :
            userAuraTheme === 'purple' ? 'text-purple-400' :
            userAuraTheme === 'emerald' ? 'text-emerald-400' :
            'text-pink-400'
          }`} />
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">STUDY SPACE GLOW TYPE</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {auraThemes.map((theme) => {
            const isSelected = userAuraTheme === theme.id;
            return (
              <button
                id={`aura_theme_selection_${theme.id}`}
                key={theme.id}
                onClick={() => onChangeAuraTheme(theme.id)}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all scroll-smooth cursor-pointer ${
                  isSelected
                    ? isLightTheme ? 'border-slate-300 bg-slate-200 text-slate-900 shadow-inner' : 'border-white/20 bg-white/5 shadow-inner'
                    : isLightTheme ? 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500' : 'border-transparent bg-white/3 hover:bg-white/5 text-slate-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${theme.color} ${theme.glow} shadow-lg`} />
                <span className={`text-[8px] font-mono tracking-tight ${isSelected ? textTitle : 'text-slate-500'}`}>
                  {theme.name.split(' ')[1]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.5 STUDYSPHERE DYNAMIC COGNITIVE THEME SELECTORS */}
      <div className={`relative mt-5 rounded-[32px] border p-5 overflow-hidden transition-all duration-300 ${bgPanel}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-3.5 relative z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">StudySphere Dynamic Themes</span>
          </div>
          {onShuffleTheme && (
            <button
              id="btn_profile_shuffle_theme"
              onClick={onShuffleTheme}
              className="px-2.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-[8px] font-mono text-amber-400 font-bold tracking-tight uppercase cursor-pointer"
            >
              Shuffle 🪄
            </button>
          )}
        </div>

        {/* Dynamic Mode Grid Items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'morning', name: 'Morning ☀️', color: 'from-sky-300 to-amber-200' },
            { id: 'afternoon', name: 'Afternoon ⚡', color: 'from-teal-400 to-emerald-300' },
            { id: 'evening', name: 'Evening 🌆', color: 'from-amber-600 to-rose-500' },
            { id: 'night', name: 'Night 🌌', color: 'from-slate-900 to-indigo-900' },
            { id: 'cyberpunk', name: 'Cyberpunk 💀', color: 'from-pink-500 to-purple-600' },
            { id: 'minimal', name: 'Minimal 📰', color: 'from-slate-200 to-slate-400' },
            { id: 'glass', name: 'Glass Lofi 🔮', color: 'from-indigo-950/40 to-slate-900' }
          ].map((mode) => {
            const isSelected = themeId === mode.id;
            return (
              <button
                id={`sphere_theme_selection_${mode.id}`}
                key={mode.id}
                onClick={() => onChangeThemeId && onChangeThemeId(mode.id)}
                className={`py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-[9.5px] font-sans font-bold cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 text-amber-400 shadow-md'
                    : isLightTheme ? 'border-slate-300 bg-slate-100/70 hover:bg-slate-200/90 text-slate-700' : 'border-white/10 bg-white/3 hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${mode.color}`} />
                <span>{mode.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CORE SVGMORPHIC PRODUCTIVITY HORIZONS CHART */}
      <div className={`relative mt-5 rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono tracking-widest text-[#22d3ee] font-bold uppercase">PRODUCTIVITY TREND</span>
          </div>
          <span className={`text-[8px] font-mono px-2 py-0.5 rounded border text-slate-500 ${bgInnerPanel}`}>7-DAY CYCLE</span>
        </div>

        {/* Custom drawn glass SVG Spark area chart */}
        <div className="relative h-28 w-full mt-2">
          <svg className="w-full h-full" viewBox="0 0 360 85" preserveAspectRatio="none">
            {/* Ambient Area Gradient definition */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal guide grids lines */}
            <line x1="20" y1="25" x2="340" y2="25" stroke={isLightTheme ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.03)"} strokeWidth="1" strokeDasharray="3" />
            <line x1="20" y1="52.5" x2="340" y2="52.5" stroke={isLightTheme ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.03)"} strokeWidth="1" strokeDasharray="3" />
            <line x1="20" y1="80" x2="340" y2="80" stroke={isLightTheme ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.05)"} strokeWidth="1" />

            {/* Area block fill path */}
            <path d={fillPointsString} fill="url(#chartGradient)" />

            {/* Area stroke boundary curve */}
            <path
              d={`M ${pointsString}`}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]"
            />

            {/* Circular coordinate nodes */}
            {dailyHours.map((val, idx) => {
              const x = (idx / (dailyHours.length - 1)) * 320 + 20;
              const y = 80 - (val / maxVal) * 55;
              return (
                <circle
                  key={`node-${idx}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill={isLightTheme ? "#ffffff" : "#090f23"}
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>
        </div>

        {/* weekday titles grids */}
        <div className="grid grid-cols-7 text-center text-[9px] font-mono text-slate-500 font-medium px-2.5 mt-2">
          {weekdays.map((day, idx) => (
            <div key={`day-label-${idx}`}>
              <p>{day}</p>
              <p className="text-[8px] text-cyan-500 font-bold mt-0.5">{dailyHours[idx]}h</p>
            </div>
          ))}
        </div>
      </div>

      {/* MONTHLY FOCUS GRID HEATMAP */}
      <div className={`relative mt-5 rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase">MONTHLY FOCUS MATRIX</span>
          </div>
          <span className="text-[8px] font-mono text-slate-500 uppercase">May 2026</span>
        </div>

        <p className="text-[9.5px] font-sans text-slate-400 leading-normal mb-3">
          Daily revision density checks. High intensity focus days glow in bright emerald!
        </p>

        {/* 28-day focus map grid */}
        <div className="grid grid-cols-7 gap-1.5 max-w-[280px] mx-auto mt-2 text-center justify-center">
          {Array.from({ length: 28 }).map((_, idx) => {
            const density = (idx * 7 + 13) % 5; // density levels 0-4
            const glowColor = 
              density === 0 ? "bg-white/5 border-transparent text-slate-500" :
              density === 1 ? "bg-emerald-500/10 border-emerald-500/15 cursor-pointer text-emerald-400/80" :
              density === 2 ? "bg-emerald-500/25 border-emerald-500/30 cursor-pointer text-emerald-300" :
              density === 3 ? "bg-emerald-500/55 border-emerald-500/50 cursor-pointer text-white" :
              "bg-emerald-400 border-teal-300 shadow-[0_0_8px_rgba(52,211,153,0.3)] cursor-pointer text-slate-950 font-black";

            return (
              <div 
                id={`heat_matrix_day_${idx+1}`}
                key={`heat-${idx}`}
                className={`w-8 h-8 rounded-lg border text-[9px] font-mono flex items-center justify-center transition-all hover:scale-105 select-none ${glowColor}`}
                title={`Day ${idx + 1}: ${density * 45} Focus Minutes practiced`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>

        {/* Legend block indicators */}
        <div className="flex justify-between items-center mt-4 px-1 text-[8.5px] font-mono text-slate-500">
          <span>0 MINS</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-white/5 border border-white/5" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/15" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/25 border border-emerald-500/30" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/55 border border-emerald-500/50" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-400 border-teal-300 shadow-[0_0_5px_rgba(52,211,153,0.3)]" />
          </div>
          <span>180+ MINS</span>
        </div>
      </div>

      {/* SUBJECT PERFORMANCE SPLIT */}
      <div className={`relative mt-5 rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-mono tracking-widest text-purple-400 font-extrabold uppercase">COGNITIVE TIME SPLITS</span>
          </div>
          <span className="text-[8px] font-mono text-slate-500 uppercase">SUBJECT WEIGHTS</span>
        </div>

        <div className="flex items-center justify-around gap-4">
          {/* SVG Custom Donut chart */}
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Science (40%) - cyan */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#22d3ee" strokeWidth="10" strokeDasharray="238.76" strokeDashoffset="95.5" />
              {/* Maths (30%) - purple */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#a855f7" strokeWidth="10" strokeDasharray="238.76" strokeDashoffset="167.13" transform="rotate(144 50 50)" />
              {/* SST (20%) - pink */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ec4899" strokeWidth="10" strokeDasharray="238.76" strokeDashoffset="191" transform="rotate(252 50 50)" />
              {/* English (10%) - emerald */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="238.76" strokeDashoffset="214.88" transform="rotate(324 50 50)" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-500">TOTAL</span>
              <span className="text-xs font-mono font-black text-white">450m</span>
            </div>
          </div>

          {/* Label Legends */}
          <div className="space-y-1.5 text-left text-[10.5px] font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="text-slate-300 font-bold">Science (40%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-300 font-bold">Mathematics (30%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
              <span className="text-slate-300 font-bold">SST history (20%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-300 font-bold">English (10%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. UNLOCKED AURA ACHIEVEMENTS */}
      <div className={`relative mt-5 rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-1.5 mb-3.5 text-purple-500 animate-pulse relative z-10">
          <Award className="w-4 h-4 text-purple-500" />
          <span className="text-[10px] font-mono tracking-widest text-[#a855f7] font-bold uppercase">BADGES & TROPHIES</span>
        </div>

        <div className="space-y-2.5">
          {achievements.map((badge) => (
            <div
              id={`achievement_${badge.id}`}
              key={badge.id}
              className={`p-3 rounded-2xl flex items-center gap-3.5 border transition-all ${
                badge.unlocked
                  ? isLightTheme ? 'bg-purple-100/40 border-purple-200 hover:border-purple-300' : 'bg-purple-500/5 border-purple-500/15 hover:border-purple-500/35'
                  : 'bg-white/1 border-white/5 opacity-40'
              }`}
            >
              {/* Badge Visual layout icon */}
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                badge.unlocked
                  ? 'bg-gradient-to-tr from-purple-500/20 to-pink-500/20 text-purple-600 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)] animate-[pulse_3s_infinite]'
                  : 'bg-white/5 text-slate-600 border-white/5'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <p className={`text-xs font-sans font-bold leading-none ${badge.unlocked ? textTitle : 'text-slate-500'}`}>
                  {badge.title}
                </p>
                <p className="text-[10px] font-sans text-slate-400 mt-1 leading-snug font-light">
                  {badge.description}
                </p>
              </div>

              {badge.unlocked && (
                <div className="ml-auto block shrink-0">
                  <span className="text-[7.5px] font-mono bg-purple-500/10 border border-purple-500/15 text-purple-600 rounded px-1.5 py-0.5 uppercase tracking-wide">
                    UNLOCKED
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
