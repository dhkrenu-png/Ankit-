/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, BookOpen, Mic, FileText, BrainCircuit, MessageSquare, 
  Plus, Play, Pause, ArrowRight, CornerDownRight, Volume2, VolumeX, 
  Trash2, HelpCircle, Hash, Quote, Award, Check, RefreshCw, Send, BookMarked
} from 'lucide-react';

interface Flashcard {
  question: string;
  answer: string;
  tag: string;
}

interface PodcastMessage {
  id: string;
  speaker: 'Aarav' | 'Aditi';
  text: string;
  action?: string;
}

interface Citation {
  source: string;
  text: string;
}

export default function NotebookLMView() {
  // Active Source management
  const [sources, setSources] = useState([
    { id: 'science-metals', name: '🔬 Science: Metals & Non-Metals', desc: 'Chapter-3 Reactivity overview, metallurgical stages, bonds' },
    { id: 'math-trig', name: '📐 Math: Trigonometry Identities', desc: 'Chapter-8 Pythagorean, complementary angle proofs, heights' },
    { id: 'sst-nationalism', name: '📜 SST: Nationalism in India', desc: 'Chapter-2 Independence freedom movement chronological dates' },
    { id: 'english-letter', name: '📖 English: A Letter to God', desc: 'Chapter-1 Lencho corn field hailstorm, irony of postmen faith' }
  ]);
  
  const [activeSourceId, setActiveSourceId] = useState<string>('science-metals');
  const [customText, setCustomText] = useState<string>('');
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);
  const [isAddingSource, setIsAddingSource] = useState<boolean>(false);
  const [newSourceName, setNewSourceName] = useState<string>('');
  const [newSourceText, setNewSourceText] = useState<string>('');

  // active workspace views: 'podcast' | 'summary' | 'flashcards' | 'chat'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'podcast' | 'summary' | 'flashcards' | 'chat'>('podcast');

  // Loaders
  const [loading, setLoading] = useState<boolean>(false);
  const [workspaceData, setWorkspaceData] = useState<{
    summary: string;
    flashcards: Flashcard[];
    cheatSheet: string[];
    podcastTitle: string;
    podcastSubtitle: string;
    podcastList: PodcastMessage[];
  } | null>(null);

  // Podcast player states
  const [isPodcastPlaying, setIsPodcastPlaying] = useState<boolean>(false);
  const [currentPodcastIndex, setCurrentPodcastIndex] = useState<number>(0);
  const [useVoiceSynth, setUseVoiceSynth] = useState<boolean>(false);
  
  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [completedCards, setCompletedCards] = useState<boolean[]>([false, false, false, false, false]);

  // Chat/RAG States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; citations?: Citation[] }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Audio elements helper references
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initializing speech synth safely if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopSpeech();
    };
  }, []);

  // Sync / Generate workspace insights whenever active source changes or custom text gets saved
  useEffect(() => {
    generateWorkspaceInsights();
    // Reset indices
    setCurrentPodcastIndex(0);
    setIsPodcastPlaying(false);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setCompletedCards([false, false, false, false, false]);
    setChatMessages([
      { sender: 'assistant', text: `Welcome back to NotebookLM. I have successfully ground my systems on this workbook. Ask me any conceptual question, generate flashcards, or start the interactive Podcast audio dive!` }
    ]);
  }, [activeSourceId]);

  const generateWorkspaceInsights = async () => {
    setLoading(true);
    stopSpeech();
    try {
      // 1. Fetch Summary / Cheat notes
      const summaryRes = await fetch('/api/gemini/notebooklm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: activeSourceId,
          customText: activeSourceId === 'custom' ? customText : undefined,
          action: 'summarize'
        })
      });
      const summaryData = await summaryRes.json();

      // 2. Fetch Deep Dive Podcast Conversation
      const podcastRes = await fetch('/api/gemini/notebooklm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: activeSourceId,
          customText: activeSourceId === 'custom' ? customText : undefined,
          action: 'podcast'
        })
      });
      const podcastData = await podcastRes.json();

      setWorkspaceData({
        summary: summaryData.summary,
        flashcards: summaryData.flashcards,
        cheatSheet: summaryData.cheatSheet,
        podcastTitle: podcastData.title || "Study Deep Dive",
        podcastSubtitle: podcastData.subtitle || "Chapter discussion guide",
        podcastList: podcastData.playlist || []
      });
    } catch (err) {
      console.error("NotebookLM setup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCustomSource = () => {
    if (!newSourceName.trim() || !newSourceText.trim()) return;
    const nextId = `custom-src-${Date.now()}`;
    const newEntry = {
      id: nextId,
      name: `✍️ ${newSourceName}`,
      desc: newSourceText.slice(0, 60) + "..."
    };

    setSources(prev => [...prev, newEntry]);
    setCustomText(newSourceText);
    setActiveSourceId(nextId);
    setNewSourceName('');
    setNewSourceText('');
    setIsAddingSource(false);
  };

  // Speak podcast script aloud using Web Speech Synthesis API
  const speakCurrentNode = () => {
    if (!synthRef.current || !workspaceData) return;
    synthRef.current.cancel();

    const currentNode = workspaceData.podcastList[currentPodcastIndex];
    if (!currentNode) return;

    // Create custom utterance speaker
    const textToSpeak = `${currentNode.speaker} says: ${currentNode.text}`;
    const utterance = new SpeechSynthesisUtterance(currentNode.text);
    
    // Choose appropriate voice parameters for male (Aarav) or female (Aditi) roles
    if (currentNode.speaker === 'Aarav') {
      utterance.rate = 1.05;
      utterance.pitch = 0.95; // Slightly lower pitch for Aarav
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.15; // Slightly higher/clear pitch for Aditi
    }

    // On completion, auto advance if play state is active
    utterance.onend = () => {
      if (isPodcastPlaying && currentPodcastIndex + 1 < workspaceData.podcastList.length) {
        setCurrentPodcastIndex(prev => prev + 1);
      } else {
        setIsPodcastPlaying(false);
      }
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  // Manage voice speech synthesis trigger on indexing or toggling
  useEffect(() => {
    if (isPodcastPlaying && useVoiceSynth) {
      speakCurrentNode();
    } else {
      stopSpeech();
    }
  }, [currentPodcastIndex, isPodcastPlaying, useVoiceSynth]);

  // Chat query RAG submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsgText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsgText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const chatRes = await fetch('/api/gemini/notebooklm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: activeSourceId,
          customText: activeSourceId.startsWith('custom-src-') ? customText : undefined,
          action: 'chat',
          userQuestion: userMsgText
        })
      });
      const chatQueryData = await chatRes.json();
      setChatMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: chatQueryData.answer,
        citations: chatQueryData.citations
      }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'assistant', text: 'Sorry champion! An error occured grounding the notebook query. Make sure files are parsed properly or retry!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleTaskLearned = (idx: number) => {
    setCompletedCards(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const getActivePodcastNode = () => {
    if (!workspaceData || workspaceData.podcastList.length === 0) return null;
    return workspaceData.podcastList[currentPodcastIndex];
  };

  return (
    <div className="space-y-5">
      
      {/* 1. SEAMLESS WORKSPACE SOURCE BAR HEADER */}
      <div className="rounded-[28px] bg-[#050917]/90 border border-white/10 p-4 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <BookMarked className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">notebooklm workbook</span>
          </div>
          
          <button
            id="btn_add_notebook_source"
            onClick={() => setIsAddingSource(!isAddingSource)}
            className="flex items-center gap-1 py-1 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[9px] font-mono text-cyan-300 uppercase transition-all"
          >
            <Plus className="w-3 h-3" /> Add Source
          </button>
        </div>

        {/* Dynamic add custom notebook source dialogue */}
        <AnimatePresence>
          {isAddingSource && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-white/5 border border-white/10 rounded-2xl text-left space-y-2.5 overflow-hidden"
            >
              <h5 className="text-[10px] font-mono text-slate-300 uppercase font-black">Paste custom Class 10 Lecture/Notes</h5>
              <input 
                id="input_new_src_name"
                type="text"
                placeholder="Ex: Life Processes Sci Ch 6"
                value={newSourceName}
                onChange={e => setNewSourceName(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <textarea
                id="textarea_new_src_text"
                placeholder="Paste revision notes or copy-pasted test material here..."
                rows={4}
                value={newSourceText}
                onChange={e => setNewSourceText(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <div className="flex gap-2">
                <button
                  id="btn_submit_custom_source"
                  onClick={handleAddNewCustomSource}
                  className="py-1 px-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded-lg text-[9px] font-mono font-bold uppercase transition"
                >
                  Confirm Upload
                </button>
                <button
                  onClick={() => setIsAddingSource(false)}
                  className="py-1 px-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[9px] font-mono uppercase transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Select Active Source list horizontal pills scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10">
          {sources.map(src => {
            const isActive = activeSourceId === src.id;
            return (
              <button
                id={`btn_src_select_${src.id}`}
                key={src.id}
                onClick={() => {
                  setActiveSourceId(src.id);
                  if (src.id.startsWith('custom-src-')) {
                    // Load corresponding paste
                  }
                }}
                className={`py-2 px-3.5 rounded-2xl text-[10px] font-sans font-bold flex-shrink-0 border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 border-none text-slate-950 shadow-lg' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {src.name}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="p-12 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-center">
            <h5 className="text-xs font-mono tracking-widest text-[#22d3ee] uppercase font-bold">RAG STUDY ENGINE SYNCING</h5>
            <p className="text-[10px] text-slate-400 font-sans mt-1">Grounding vector facts & generating interactive mock podcasts...</p>
          </div>
        </div>
      ) : (
        workspaceData && (
          <div className="space-y-4 text-left">
            
            {/* 2. TAB CONTROLLER FOR ACTIVE WORKSPACE TOOLS */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#050c1f] rounded-2xl border border-white/5 shadow-inner">
              {[
                { id: 'podcast', label: '🎙️ Podcast', col: 'text-amber-400' },
                { id: 'summary', label: '📝 Guide', col: 'text-cyan-400' },
                { id: 'flashcards', label: '🃏 Cards', col: 'text-purple-400' },
                { id: 'chat', label: '💬 Chat Q&A', col: 'text-emerald-400' }
              ].map(tab => (
                <button
                  id={`btn_workspace_tab_${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setActiveWorkspaceTab(tab.id as any);
                    stopSpeech();
                    setIsPodcastPlaying(false);
                  }}
                  className={`py-2 rounded-xl text-[9px] font-sans font-extrabold tracking-tight transition-all cursor-pointer ${
                    activeWorkspaceTab === tab.id
                      ? 'bg-white/10 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 3. DYNAMIC WORKSPACE PANEL CONTENT AREA */}

            {/* A. DEEP-DIVE AUDIO GENERATED PODCAST */}
            {activeWorkspaceTab === 'podcast' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[32px] bg-[#020512]/90 border border-white/10 p-5 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-8xl text-purple-500 select-none pointer-events-none">🎙️</div>
                <span className="text-[8px] font-mono tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15 uppercase font-bold">Dual-Host Notebook Audio</span>
                
                <div className="mt-2.5">
                  <h3 className="text-sm font-sans font-extrabold text-white leading-tight">{workspaceData.podcastTitle}</h3>
                  <p className="text-[10px] font-mono text-slate-400">{workspaceData.podcastSubtitle}</p>
                </div>

                {/* Animated visual wave player or CASSETTE DISC element */}
                <div className="my-5 p-4 rounded-3xl bg-[#090e24] border border-white/5 flex flex-col items-center relative gap-4">
                  
                  {/* Rotating Cassette graphic */}
                  <div className="flex justify-around items-center w-full relative">
                    
                    {/* Aarav Host block */}
                    <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${getActivePodcastNode()?.speaker === 'Aarav' ? 'scale-110 opacity-100 ring-2 ring-amber-400/30 p-2 rounded-2xl bg-white/1' : 'scale-95 opacity-50'}`}>
                      <div className="w-12 h-12 rounded-full border border-amber-400/30 bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg uppercase font-bold font-mono text-slate-900 text-lg">
                        👦🏻
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest">Host: Aarav</span>
                      <span className="text-[8px] text-slate-500 italic">"Relatable Student"</span>
                    </div>

                    {/* Central Pulsing Wave / Cassette Hole */}
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-slate-950 shadow-inner">
                      <div className={`w-3 h-3 rounded-full bg-cyan-400 ${isPodcastPlaying ? 'animate-ping' : ''}`} />
                    </div>

                    {/* Aditi Host block */}
                    <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${getActivePodcastNode()?.speaker === 'Aditi' ? 'scale-110 opacity-100 ring-2 ring-pink-500/30 p-2 rounded-2xl bg-white/1' : 'scale-95 opacity-50'}`}>
                      <div className="w-12 h-12 rounded-full border border-pink-400/30 bg-gradient-to-tr from-pink-500 to-rose-300 flex items-center justify-center shadow-lg uppercase font-bold font-mono text-slate-900 text-lg">
                        👩🏻
                      </div>
                      <span className="text-[9px] font-mono font-bold text-pink-400 uppercase tracking-widest">Co-Host: Aditi</span>
                      <span className="text-[8px] text-slate-500 italic">"Subject Specialist"</span>
                    </div>

                  </div>

                  {/* SUBTITLE & DIALOGUE SUBSECTION */}
                  <div className="w-full text-center min-h-[56px] flex flex-col justify-center items-center px-2">
                    {getActivePodcastNode() ? (
                      <div>
                        {getActivePodcastNode()?.action && (
                          <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-purple-300 italic mb-1.5 inline-block uppercase tracking-wide">
                            * {getActivePodcastNode()?.action} *
                          </span>
                        )}
                        <p className="text-xs font-sans text-slate-200 leading-normal font-medium max-w-xs">{getActivePodcastNode()?.text}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-sans text-slate-500 italic">End of Podcast stream. Click Play to listen!</p>
                    )}
                  </div>

                  {/* Simulated wave levels */}
                  {isPodcastPlaying && (
                    <div className="flex gap-0.5 items-end justify-center h-4 w-32 pb-0.5">
                      {Array.from({ length: 15 }).map((_, i) => {
                        const heights = ['h-1', 'h-2', 'h-4', 'h-3', 'h-1.5', 'h-2.5', 'h-3.5', 'h-2', 'h-4', 'h-3', 'h-1', 'h-2', 'h-3', 'h-2.5', 'h-1.5'];
                        const pickedH = heights[Math.floor(Math.random() * heights.length)];
                        return (
                          <div 
                            key={`wave-${i}`} 
                            style={{ animationDelay: `${i * 120}ms` }}
                            className={`w-0.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full transition-all duration-150 animate-pulse ${pickedH}`} 
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* PROGRESS CONTROLLER */}
                  <div className="w-full space-y-1 mt-1">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((currentPodcastIndex + 1) / (workspaceData.podcastList.length || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500">
                      <span>SPEAKER SLIDE {currentPodcastIndex + 1} of {workspaceData.podcastList.length}</span>
                      <span>{Math.round(((currentPodcastIndex + 1) / (workspaceData.podcastList.length || 1)) * 100)}% COMPLETE</span>
                    </div>
                  </div>

                  {/* VOICE SYNTH COMPANION CONTROL */}
                  <div className="flex items-center gap-2 justify-center w-full pt-1.5 border-t border-white/5">
                    <button
                      id="btn_toggle_voice_synth"
                      onClick={() => {
                        const setVal = !useVoiceSynth;
                        setUseVoiceSynth(setVal);
                        if (!setVal) stopSpeech();
                      }}
                      className={`flex items-center gap-1.5 py-1 px-3 rounded-xl text-[8.5px] font-mono border transition-all ${
                        useVoiceSynth 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {useVoiceSynth ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      {useVoiceSynth ? "Real Audio Voiceover Active" : "Enable Audio Speech Mode"}
                    </button>
                    {useVoiceSynth && (
                      <span className="text-[8px] font-mono text-emerald-400 animate-pulse uppercase tracking-widest font-extrabold">• SPEAKS LIVE</span>
                    )}
                  </div>

                </div>

                {/* PLAYBACK ACTION CONTROLLER */}
                <div className="flex justify-between items-center gap-2 mt-4">
                  <button
                    id="btn_podcast_back"
                    onClick={() => {
                      if (currentPodcastIndex > 0) {
                        setCurrentPodcastIndex(prev => prev - 1);
                        setIsPodcastPlaying(true);
                      }
                    }}
                    disabled={currentPodcastIndex === 0}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                  >
                    Back Node
                  </button>

                  <button
                    id="btn_podcast_play_toggle"
                    onClick={() => setIsPodcastPlaying(!isPodcastPlaying)}
                    className="flex-1 py-3 px-4 rounded-3xl bg-amber-500 hover:bg-amber-600 font-sans font-extrabold text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    {isPodcastPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-slate-950 font-extrabold" /> Pause Discussion
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950 font-extrabold" /> Play Study Guide Audio
                      </>
                    )}
                  </button>

                  <button
                    id="btn_podcast_next"
                    onClick={() => {
                      if (currentPodcastIndex + 1 < workspaceData.podcastList.length) {
                        setCurrentPodcastIndex(prev => prev + 1);
                        setIsPodcastPlaying(true);
                      }
                    }}
                    disabled={currentPodcastIndex + 1 >= workspaceData.podcastList.length}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                  >
                    Next Node
                  </button>
                </div>

              </motion.div>
            )}

            {/* B. DETAILED STUDY REFERENCE GUIDE */}
            {activeWorkspaceTab === 'summary' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[32px] bg-[#020512]/95 border border-white/10 p-5 shadow-2xl space-y-4"
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono tracking-widest text-[#22d3ee] font-bold uppercase">Grounded study textbook guide</span>
                  </div>
                  <span className="text-[8px] font-mono bg-[#22d3ee]/10 px-2 py-0.5 rounded border border-[#22d3ee]/20 text-[#22d3ee]">AI SYNCHRONOUS</span>
                </div>

                {/* Generated Revision Summary markdown display container */}
                <div className="max-h-80 overflow-y-auto pr-1 space-y-4 text-xs font-sans text-slate-200 leading-relaxed scrollbar-thin">
                  
                  {/* Summary formatted view */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-300 relative">
                    <Quote className="absolute top-2 right-2 w-8 h-8 opacity-5 text-cyan-400" />
                    <p className="whitespace-pre-line leading-relaxed">{workspaceData.summary}</p>
                  </div>

                  {/* Cheat revision table sheet */}
                  {workspaceData.cheatSheet.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold">🚨 Copy cheat board notes:</h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        {workspaceData.cheatSheet.map((cht, i) => (
                          <div key={`cht-${i}`} className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
                            <span className="w-4 h-4 rounded bg-amber-500 text-slate-900 text-[9px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                            <p className="text-[10.5px] font-sans text-amber-200/90 leading-tight">{cht}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* C. INTERACTIVE FLIP FLASHCARDS */}
            {activeWorkspaceTab === 'flashcards' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[32px] bg-[#020512]/95 border border-white/10 p-5 shadow-2xl text-center space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Revision Flashcards</span>
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-500">CARD {currentCardIndex + 1} of {workspaceData.flashcards.length}</span>
                </div>

                {/* Main Flippable Card Canvas */}
                <div 
                  id="notebook_flashcard"
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="relative aspect-[4/3.1] w-full rounded-[24px] bg-[#0d102e] border border-white/10 p-5 shadow-2xl flex flex-col justify-center items-center cursor-pointer select-none group transition-all duration-500 hover:border-purple-500/30 overflow-hidden"
                >
                  {/* Neon Glow backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

                  {/* Indicator to flip */}
                  <div className="absolute top-2 right-2 rounded-lg bg-white/5 border border-white/5 text-[7.5px] font-mono text-slate-500 uppercase px-1.5 py-0.5">
                    Click card to flip
                  </div>

                  <AnimatePresence mode="wait">
                    {!isCardFlipped ? (
                      <motion.div
                        key="front"
                        initial={{ opacity: 0, rotateY: -95 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: 95 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-2.5 text-center flex flex-col items-center justify-center h-full"
                      >
                        <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 uppercase font-black uppercase tracking-widest">{workspaceData.flashcards[currentCardIndex]?.tag || "Study"}</span>
                        <h4 className="text-sm font-sans font-extrabold text-white leading-normal max-w-xs">{workspaceData.flashcards[currentCardIndex]?.question}</h4>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="back"
                        initial={{ opacity: 0, rotateY: 95 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: -95 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-2.5 text-center flex flex-col items-center justify-center h-full"
                      >
                        <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 uppercase font-bold tracking-widest">Ground Truth Answer</span>
                        <p className="text-xs font-sans text-slate-200 leading-normal max-w-xs">{workspaceData.flashcards[currentCardIndex]?.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Flip control action bar */}
                <div className="flex gap-2.5 items-center justify-between">
                  
                  <button
                    id="btn_prev_card"
                    onClick={() => {
                      setIsCardFlipped(false);
                      if (currentCardIndex > 0) {
                        setCurrentCardIndex(prev => prev - 1);
                      }
                    }}
                    disabled={currentCardIndex === 0}
                    className="py-2 px-3.5 rounded-xl bg-white/5 border border-white/5 disabled:opacity-30 text-xs font-mono font-extrabold text-slate-200 transition"
                  >
                    Prev Card
                  </button>

                  {/* Mark learned ticker */}
                  <button
                    id="btn_mark_card_learned"
                    onClick={() => toggleTaskLearned(currentCardIndex)}
                    className={`py-2 px-4 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold transition-all ${
                      completedCards[currentCardIndex]
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 font-bold" />
                    {completedCards[currentCardIndex] ? "Concept Learned! ✓" : "Mark as Learned"}
                  </button>

                  <button
                    id="btn_next_card"
                    onClick={() => {
                      setIsCardFlipped(false);
                      if (currentCardIndex + 1 < workspaceData.flashcards.length) {
                        setCurrentCardIndex(prev => prev + 1);
                      }
                    }}
                    disabled={currentCardIndex + 1 >= workspaceData.flashcards.length}
                    className="py-2 px-3.5 rounded-xl bg-white/5 border border-white/5 disabled:opacity-30 text-xs font-mono font-extrabold text-slate-200 transition"
                  >
                    Next Card
                  </button>

                </div>
              </motion.div>
            )}

            {/* D. GROUNDED CHAT RAG CHAT BOT */}
            {activeWorkspaceTab === 'chat' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[32px] bg-[#020512]/95 border border-white/10 p-5 shadow-2xl flex flex-col h-[400px]"
              >
                <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/5 mb-3 flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">Grounded Source chat (RAG)</span>
                </div>

                {/* Dialog Log messages area scroll view */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin text-xs font-sans">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={`chat-msg-${i}`}
                      className={`p-3 rounded-2xl max-w-[85%] space-y-2.5 transition-all text-left ${
                        msg.sender === 'user'
                          ? 'ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold'
                          : 'bg-white/5 border border-white/5 text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                      
                      {/* RAG Citations grounded proofs */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-white/10 space-y-1">
                          <span className="text-[8px] font-mono tracking-widest text-[#22d3ee] font-black uppercase">📖 GROUNDED citations/proofs:</span>
                          {msg.citations.map((cit, cidx) => (
                            <div key={`cit-${cidx}`} className="p-1 px-2 rounded bg-cyan-950/40 border border-cyan-500/15 text-[9px] text-[#22d3ee]/90">
                              <span className="font-bold underline">{cit.source}:</span> "{cit.text}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing animation block */}
                  {chatLoading && (
                    <div className="p-3 bg-white/5 border border-white/5 text-slate-400 rounded-2xl max-w-[50%] mr-auto flex gap-1.5 items-center">
                      <span className="text-[9px] font-mono uppercase tracking-widest animate-pulse">Fact checking...</span>
                      <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Question form input area */}
                <form 
                  onSubmit={handleChatSubmit}
                  className="mt-3 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2 flex items-center gap-1 flex-shrink-0"
                >
                  <input
                    id="input_notebook_chat_query"
                    type="text"
                    placeholder="Ask standard or homework questions..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none flex-1 font-sans placeholder-slate-500"
                  />
                  <button
                    id="btn_submit_notebook_chat"
                    type="submit"
                    className="p-1.5 rounded-xl hover:bg-white/5 text-emerald-400 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </motion.div>
            )}

          </div>
        )
      )}

    </div>
  );
}
