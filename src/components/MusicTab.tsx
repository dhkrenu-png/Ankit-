/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, Play, Pause, SkipForward, SkipBack, Share2, 
  Sparkles, Heart, Volume2, Volume1, VolumeX, Bookmark, Flame, Radio,
  Plus, X, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { SongTrack } from '../types';

interface MusicTabProps {
  key?: string;
  songs: SongTrack[];
  currentSongIndex: number;
  onSelectSong: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onAddSong?: (song: Omit<SongTrack, 'id'>) => void;
}

export default function MusicTab({
  songs,
  currentSongIndex,
  onSelectSong,
  isPlaying,
  onTogglePlay,
  onAddSong
}: MusicTabProps) {
  const currentSong = songs[currentSongIndex];
  const [songProgress, setSongProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // States for interactive volume and mute controls
  const [volume, setVolume] = useState(80); // Default 80% volume
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);

  // States for dynamic song addition
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newDuration, setNewDuration] = useState(180); // Default 3 minutes
  const [newCategory, setNewCategory] = useState<'lofi' | 'ambient' | 'chill' | 'frequency'>('lofi');
  const [newGradient, setNewGradient] = useState('from-purple-500 to-pink-500');

  const presetGradients = [
    { label: 'Cyan Breeze', value: 'from-blue-500 to-cyan-500', bg: 'bg-gradient-to-tr from-blue-500 to-cyan-500' },
    { label: 'Sakura Wave', value: 'from-purple-500 to-pink-500', bg: 'bg-gradient-to-tr from-purple-500 to-pink-500' },
    { label: 'Sunset Flare', value: 'from-pink-500 to-rose-450', bg: 'bg-gradient-to-tr from-pink-500 to-rose-450' },
    { label: 'Cosmic Nebula', value: 'from-[#0ea5e9] to-[#8b5cf6]', bg: 'bg-gradient-to-tr from-[#0ea5e9] to-[#8b5cf6]' },
    { label: 'Solar Flares', value: 'from-amber-500 to-orange-550', bg: 'bg-gradient-to-tr from-amber-500 to-orange-550' },
    { label: 'Forest Green', value: 'from-emerald-500 to-teal-600', bg: 'bg-gradient-to-tr from-emerald-500 to-teal-600' },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (onAddSong) {
      onAddSong({
        title: newTitle.trim(),
        artist: newArtist.trim() || 'Ambient Studio',
        duration: newDuration,
        category: newCategory,
        coverGradient: newGradient,
      });
    }

    // Reset fields
    setNewTitle('');
    setNewArtist('');
    setNewDuration(180);
    setNewCategory('lofi');
    setNewGradient('from-purple-500 to-pink-500');
    setShowAddForm(false);

    // Auto select the new track
    setTimeout(() => {
      onSelectSong(songs.length);
    }, 50);
  };

  // Sync simulated progress bar
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setSongProgress((prev) => {
          if (prev >= currentSong.duration) {
            handleNextSong(); // auto-forward
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, currentSongIndex]);

  // Reset progress when shifting tracks
  useEffect(() => {
    setSongProgress(0);
  }, [currentSongIndex]);

  const handleNextSong = () => {
    const nextIdx = (currentSongIndex + 1) % songs.length;
    onSelectSong(nextIdx);
  };

  const handlePrevSong = () => {
    const prevIdx = (currentSongIndex - 1 + songs.length) % songs.length;
    onSelectSong(prevIdx);
  };

  // Toggle Mute / Unmute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (volume === 0) {
        setVolume(prevVolume || 80);
      }
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  };

  // Handle manual volume slider adjustments
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol > 0) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  // Retrieve matching volume icons dynamically based on dB levels/mute status
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-4 h-4 text-pink-400" />;
    }
    if (volume < 50) {
      return <Volume1 className="w-4 h-4 text-pink-400" />;
    }
    return <Volume2 className="w-4 h-4 text-pink-400" />;
  };

  // Human readable times (m:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="pb-32 pt-4 px-4 max-w-sm mx-auto select-none"
    >
      {/* HEADER LOGO PANEL */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-sm font-mono tracking-widest text-[#ec4899] flex items-center gap-1.5 font-bold uppercase">
            <Music className="w-4 h-4 text-pink-400" /> AURA_SYNTH
          </h2>
          <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">Atmospheric Study Chords</p>
        </div>
        <div className="text-[9px] font-mono bg-white/5 border border-white/5 text-pink-300 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Flame className="w-3 h-3 text-pink-400 animate-pulse" /> HIGH_FIDELITY
        </div>
      </div>

      {/* CORE HOLO VINYL PLAYER CARD */}
      <div className="relative rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl relative flex flex-col items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent pointer-events-none" />
        {/* Ambient neon radial blast */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-pink-500/10 rounded-full blur-[80px]" />

        {/* Floating plate artwork */}
        <div className="relative w-44 h-44 flex items-center justify-center mt-2">
          {/* Rotating vinyl base disc */}
          <motion.div
            className={`absolute inset-0 rounded-full border border-white/5 bg-[#0e0915] flex items-center justify-center p-4 relative ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}
            style={{
              boxShadow: '0 15px 35px rgba(0,0,0,0.6), inset 0 0 15px rgba(255,255,255,0.05)'
            }}
          >
            {/* Grooves etching */}
            <div className="absolute inset-2 border border-slate-950/20 rounded-full" />
            <div className="absolute inset-5 border border-slate-950/20 rounded-full" />
            <div className="absolute inset-8 border border-slate-950/20 rounded-full" />
            <div className="absolute inset-12 border border-slate-950/25 rounded-full" />

            {/* Inner dynamic color shield cover */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${currentSong.coverGradient} p-1 flex items-center justify-center relative shadow-inner overflow-hidden border border-white/10`}>
              <div className="w-6 h-6 rounded-full bg-[#050505] flex items-center justify-center relative z-10 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              </div>
            </div>
          </motion.div>

          {/* Glowing laser stylus needle arm detail */}
          <div className="absolute -top-1 -right-4 w-12 h-20 origin-top pointer-events-none transform rotate-[-12deg]">
            <div className="w-1 bg-slate-400/30 h-16 relative">
              <div className="absolute bottom-0 right-[-2px] w-2.5 h-3.5 bg-pink-500 rounded blur-[0.5px]" />
            </div>
          </div>
        </div>

        {/* SONG INFORMATION */}
        <div className="text-center mt-6 w-full px-2">
          <p className="text-sm font-sans font-bold text-white tracking-wide truncate">{currentSong.title}</p>
          <p className="text-[11px] font-sans text-slate-400 mt-1">{currentSong.artist}</p>
        </div>

        {/* CORE INTERACTIVE PROGRESS TRACK SLIDER */}
        <div className="w-full mt-6 space-y-1.5 relative z-10">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 relative cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
              style={{ width: `${(songProgress / currentSong.duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
            <span>{formatTime(songProgress)}</span>
            <span>{formatTime(currentSong.duration)}</span>
          </div>
        </div>

        {/* EQUALIZER FREQUENCY BARS VIEW */}
        <div className="h-6 flex items-end justify-center gap-1 mt-3 w-full border-b border-white/5 pb-2">
          {Array.from({ length: 18 }).map((_, bIdx) => {
            const hRange = isPlaying ? [1, 2.5, 5, 3, 1] : [1.5, 1.5];
            const durationArr = [0.8, 1.2, 0.9, 1.5, 0.7];
            const randomDur = durationArr[bIdx % durationArr.length];

            return (
              <motion.div
                key={`eq-bar-${bIdx}`}
                className="w-1 bg-[#ec4899] rounded-t"
                animate={{
                  height: isPlaying 
                    ? [4, Math.random() * 18 + 4, 4] 
                    : 3
                }}
                transition={{
                  duration: randomDur,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            );
          })}
        </div>

        {/* INTERACTIVE VOLUME CONTROLLER & MUTE TOGGLE */}
        <div id="volume_controller_container" className="w-full mt-3.5 flex items-center gap-2.5 relative z-10 px-2.5 bg-white/5 border border-white/5 py-1.5 rounded-2xl">
          <button
            id="btn_sound_mute_toggle"
            onClick={toggleMute}
            className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-pink-400 hover:text-pink-300 transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {getVolumeIcon()}
          </button>
          
          <div className="flex-1 flex items-center group relative">
            <input
              id="slider_volume_adjust"
              type="range"
              min="0"
              max="100"
              step="1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer bg-white/10 h-1 rounded-lg hover:h-1.5 transition-all outline-none"
              style={{
                background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${isMuted ? 0 : volume}%, rgba(255,255,255,0.1) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>

          <span className="text-[9px] font-mono text-slate-400 min-w-[28px] text-right font-semibold">
            {isMuted ? "MUTED" : `${volume}%`}
          </span>
        </div>

        {/* MEDIA CONSOLE SYSTEM INTERFACE */}
        <div className="flex items-center gap-6 mt-4 relative z-10">
          <button
            id="btn_music_prev"
            onClick={handlePrevSong}
            className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            id="btn_music_play_pause"
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 text-white flex items-center justify-center border border-white/10 shadow-[0_5px_15px_rgba(236,72,153,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </button>

          <button
            id="btn_music_next"
            onClick={handleNextSong}
            className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RECONSOLIDATED STUDY PLAYLIST TABLE */}
      <div className="relative mt-5 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-center mb-3 relative z-10">
          <h3 className="text-[10px] font-mono tracking-widest text-[#ec4899] font-bold uppercase">STUDY PLAYLISTS</h3>
          <button
            id="btn_toggle_add_track_form"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-pink-500/25 text-[9px] font-mono uppercase text-pink-400 hover:text-white hover:bg-pink-500/15 hover:border-pink-500/40 transition-all cursor-pointer"
          >
            {showAddForm ? (
              <>
                <X className="w-3 h-3" /> CLOSE
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" /> ADD MUSIC
              </>
            )}
          </button>
        </div>

        {/* Expandable Music Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              onSubmit={handleFormSubmit}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 overflow-hidden text-left"
            >
              <div>
                <label className="text-[8px] font-mono tracking-wider text-slate-400 uppercase block mb-1">Track Name / Title *</label>
                <input
                  id="input_new_track_title"
                  type="text"
                  placeholder="e.g. Deep Concentration Lofi"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-[#0d0718]/60 text-slate-250 placeholder-slate-600 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:border-pink-500/40 outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-mono tracking-wider text-slate-400 uppercase block mb-1">Artist</label>
                  <input
                    id="input_new_track_artist"
                    type="text"
                    placeholder="Lofi Producer"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full bg-[#0d0718]/60 text-slate-250 placeholder-slate-600 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:border-pink-500/40 outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono tracking-wider text-slate-400 uppercase block mb-1">Category</label>
                  <select
                    id="select_new_track_category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#0d0718]/60 text-slate-250 border border-white/10 rounded-xl px-2 py-1.5 text-xs focus:border-pink-500/40 outline-none font-sans cursor-pointer text-slate-300"
                  >
                    <option value="lofi">Lofi Beat</option>
                    <option value="ambient">Ambient</option>
                    <option value="chill">Chillout</option>
                    <option value="frequency">Binaural Freq</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[8px] font-mono tracking-wider text-slate-400 uppercase">Duration</label>
                  <span className="text-[9px] font-mono text-pink-400 font-bold">{formatTime(newDuration)}</span>
                </div>
                <input
                  id="slider_new_track_duration"
                  type="range"
                  min="30"
                  max="420"
                  step="5"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer bg-white/10 h-1 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono tracking-wider text-slate-400 uppercase block mb-1.5">Artwork Theme</label>
                <div className="flex flex-wrap gap-2">
                  {presetGradients.map((g, idx) => (
                    <button
                      id={`btn_gradient_art_${idx}`}
                      key={g.value}
                      type="button"
                      onClick={() => setNewGradient(g.value)}
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all relative cursor-pointer hover:scale-105 active:scale-95"
                      style={{
                        background: `linear-gradient(to top right, ${g.value.split(' ')[0].replace('from-', '')}, ${g.value.split(' ')[1].replace('to-', '')})`,
                        borderColor: newGradient === g.value ? '#ec4899' : 'rgba(255,255,255,0.1)'
                      }}
                      title={g.label}
                    >
                      {newGradient === g.value && (
                        <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="btn_submit_new_track"
                type="submit"
                className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-sans font-bold text-xs shadow-[0_4px_15px_rgba(236,72,153,0.3)] hover:opacity-95 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> ADD TO PLAYLIST
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-2 max-h-[160px] overflow-y-auto relative z-10">
          {songs.map((song, idx) => {
            const isSelected = idx === currentSongIndex;

            return (
              <div
                id={`playlist_track_${song.id}`}
                key={song.id}
                onClick={() => onSelectSong(idx)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-pink-500/10 border-pink-500/20 text-white'
                    : 'bg-white/3 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {/* Visual miniature album cover */}
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex-shrink-0 flex items-center justify-center border border-white/10`}>
                  <Music className="w-3.5 h-3.5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-sans font-semibold truncate ${isSelected ? 'text-pink-300' : 'text-slate-200'}`}>
                    {song.title}
                  </p>
                  <p className="text-[9px] font-sans text-slate-500 truncate mt-0.5">{song.artist}</p>
                </div>

                <div className="flex items-center gap-2 relative w-12 h-8 justify-end text-right">
                  {/* Default Duration Display - transitions out on hover */}
                  <span className="text-[9px] font-mono text-slate-500 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-x-1.5 absolute right-0">
                    {formatTime(song.duration)}
                  </span>

                  {/* Interactively Revealed Hover Action Play/Pause Orb */}
                  <div className="opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 absolute right-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.4)]">
                      {isSelected && isPlaying ? (
                        <Pause className="w-2.5 h-2.5 text-pink-400" />
                      ) : (
                        <Play className="w-2.5 h-2.5 text-pink-400 fill-pink-400/30 ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Subtle active state ping */}
                  {isSelected && isPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping absolute -left-2 top-1/2 -translate-y-1/2 group-hover:opacity-0 transition-opacity" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
