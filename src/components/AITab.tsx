/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Flame, Zap, Sparkles, MessageSquare, Send, RefreshCw, 
  X, AlertCircle, Play, Sliders, Volume2, Award, ShieldAlert,
  Frown, Compass, Star, ChevronRight, Brain, Smile, Skull
} from 'lucide-react';
import { AppTab } from '../types';

interface AITabProps {
  key?: string;
  focusMinutes: number;
  streak: number;
  onTabChange: (tab: AppTab) => void;
  themeId?: string;
}

export default function AITab({ focusMinutes, streak, onTabChange, themeId = 'night' }: AITabProps) {
  // Savage Hindi Roasts list
  const roasts = [
    { text: "Bhai phone ki battery se zyada low tumhari productivity hai 💀", mood: "Savage" },
    { text: "Instagram kholne ki speed dekhkar lagta hai Olympic medal aa jayega 😭", mood: "Meme" },
    { text: "Homework tumhara wait kar raha hai jaise crush reply ka karti hai 👀", mood: "Reality Check" },
    { text: "2 minute padhai aur 3 ghante scrolling… wah beta wah 😭", mood: "Exposed" },
    { text: "Topper banne ka sapna aur alarm snooze ka rishta bahut gehra hai 💀", mood: "Savage" },
    { text: "Padh le bhai warna future me calculator bhi ignore karega 😭", mood: "Critical Hit" },
    { text: "Kyun bhai, reels dekh kar lag raha hai ki Ambani ban rahe ho? 👀", mood: "Savage" },
    { text: "Padhai shuru karte hi neend aati hai jaise dimag me bedtime music chal raha ho 😴", mood: "Meme" },
    { text: "Aura check: Your focus level is currently in minus negative, bro! 📉", mood: "Reality Check" },
    { text: "IIT/AIIMS ka sapna aur 12 baje tak sone ka rishta... wah beta! 💀", mood: "Exposed" },
    { text: "Mummy papa ko lag raha hai lecture dekh raha hai, par yahan alt-tab champions chal rahe hain 😂", mood: "Critical Hit" },
    { text: "Ek baar focus timer start karke dekho, phone khud darr jayega! ⚡", mood: "Motivational Burn" },
    { text: "Padh lo beta, warna future me default notification tone ki tarah ignore ho jaoge! 😭", mood: "Reality Check" },
    { text: "Procrastination level itna high hai ki procrastinate karne ke liye bhi kal ka schedule banate ho 💀", mood: "Savage" },
    { text: "Calendar me red marks dekhkar schedule darr jata hai tumhara 👀", mood: "Exposed" },
    { text: "Beta, syllabus dekhkar bolte ho 'Dekha jayega', fir exam ke din akele me rote ho 😭", mood: "Reality Check" },
    { text: "Motivation reels dekhkar thodi der ke liye sher bante ho, fir agle hi second reel scroll karne lagte ho 💀", mood: "Meme" }
  ];

  // Positive energetic motivation lines in dynamic Hindi-English
  const motivations = [
    { text: "Suno bhai, jo aaj ro rahe ho padhte waqt, kal wahi log khade hokar taali bajaenge! Utho aur focus karo! ⚡", mood: "Sher State" },
    { text: "Aura automatic badhega jab marksheet me top ranks chamkengi. Switch off the noise and grind! 🏆", mood: "Warrior Aura" },
    { text: "Ek din tumhara kaam pure shehar me goonjega. Chhoti shuruat karo par aaj hi karo! 🌌", mood: "Alpha Focus" },
    { text: "Distraction temporary hai, par achievement ka aura permanent hai. Stay focused, master! 🔥", mood: "Legend State" }
  ];

  const presets = [
    "Science Chapter 3 weak lag raha hai 😭 revise kar lo.",
    "Board exam paas aa raha hai bhai, ab reel kam aur revision zyada 💀",
    "Math formulas revise karne ka time aa gaya 😎",
    "Savage roast for scrolling 💀",
    "Aise soenge toh CBSE topper kaise banenge? ✨"
  ];

  // States
  const [activeRoast, setActiveRoast] = useState(roasts[0]);
  const [scrollHours, setScrollHours] = useState(3);
  const [chatInput, setChatInput] = useState('');
  const [aiMood, setAiMood] = useState<'helpful' | 'sarcastic' | 'motivational'>('sarcastic');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'bot'; text: string; mode?: string }[]>([
    { sender: 'bot', text: "Ayan, swagat hai Class 10 Board Warrior! Main hoon tumhara Savage Sentinel AI coach. Board exam paas aa raha hai, isiliye Reels kam karo, Science/Maths revise karo aur mujhse real-time reality checks lo! 💀⚡", mode: "Board Sentinel Core" }
  ]);
  const [orbState, setOrbState] = useState<'idle' | 'burning' | 'talking'>('idle');
  const [isTyping, setIsTyping] = useState(false);

  // Custom Coach Configurator States
  const [customTraits, setCustomTraits] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  // Load Speech Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    // Cancel existing speech
    window.speechSynthesis.cancel();
    
    // Clean emojis & special characters
    let cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');
    cleanText = cleanText.replace(/[💀😭👀😴📉😂✨🔥🏆🏆🏆🌌🔥⚡]/g, '').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    // Find Indian English Male voice
    let voice = voices.find(v => 
      (v.lang.toLowerCase().includes('in') || v.lang.toLowerCase().includes('hi-in')) &&
      (v.name.toLowerCase().includes('ravi') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('karan') || v.name.toLowerCase().includes('dilip'))
    );
    
    if (!voice) {
      // Find any Indian English / Hindi voice
      voice = voices.find(v => v.lang.toLowerCase().includes('in') || v.lang.toLowerCase().includes('india') || v.lang.startsWith('hi'));
    }
    
    if (!voice) {
      // Find any male English voice
      voice = voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('google')));
    }
    
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.pitch = 0.95; // Deeper male-like tone
    utterance.rate = 0.92;  // Natural steady speed
    window.speechSynthesis.speak(utterance);
  };

  const getPlaceholder = () => {
    if (aiMood === 'helpful') return "Ask study help, formulas...";
    if (aiMood === 'motivational') return "Ask for high warrior energy...";
    return "Ask to get roasted 💀...";
  };

  // Multilingual Motivation States
  const [desiLanguage, setDesiLanguage] = useState<'hindi' | 'hinglish'>('hinglish');
  const [desiTone, setDesiTone] = useState<'energetic' | 'calm' | 'warrior' | 'serious' | 'funny' | 'angry' | 'roasting'>('energetic');
  const [desiQuote, setDesiQuote] = useState("Suno bhai! Pura power laga do aaj. Kal jab success milegi toh shor khud goonjega! Let's crash this task! ⚡");
  const [loadingDesi, setLoadingDesi] = useState(false);

  const fetchDesiQuote = async (lang = desiLanguage, tone = desiTone) => {
    setLoadingDesi(true);
    try {
      const res = await fetch(`/api/gemini/multilingual-motivation?language=${lang}&tone=${tone}`);
      const data = await res.json();
      if (data && data.text) {
        setDesiQuote(data.text);
      }
    } catch (error) {
      console.error("Error fetching desi quote:", error);
    } finally {
      setLoadingDesi(false);
    }
  };

  useEffect(() => {
    fetchDesiQuote(desiLanguage, desiTone);
  }, [desiLanguage, desiTone]);

  // Play a random savage roast
  const triggerRandomRoast = () => {
    setOrbState('burning');
    setIsTyping(true);
    const randomIndex = Math.floor(Math.random() * roasts.length);
    const selected = roasts[randomIndex];
    
    setTimeout(() => {
      setActiveRoast(selected);
      // Append to simulated chat
      setChatLog(prev => [
        ...prev,
        { sender: 'bot', text: selected.text, mode: selected.mood }
      ]);
      setOrbState('talking');
      setIsTyping(false);
      
      if (autoSpeak) {
        speakText(selected.text);
      }
      
      // Return to idle
      setTimeout(() => setOrbState('idle'), 2500);
    }, 450);
  };

  // Generate customized doomscrolling roasts based on hours
  const triggerCustomScrollRoast = () => {
    setOrbState('burning');
    setIsTyping(true);
    let responseText = "";
    
    if (scrollHours <= 1) {
      responseText = `1 ghanta scroll kiya? Chalo theek hai, innocent level hai but ek min... homework ho gaya kya tumhara? 👀`;
    } else if (scrollHours <= 3) {
      responseText = `${scrollHours} ghante scrolling?! Bhai Instagram kholne ki speed dekhkar lagta hai Olympic gold medal seedhe tumhare ghar aayega 😭 Reels dekh ke digital wealth badh gaya kya?`;
    } else if (scrollHours <= 5) {
      responseText = `${scrollHours} ghante scrolling?! Tumhara focus level minus zone me chala gaya hai! Padh le bhai warna future me sabse tagda ignore tum hi sahowge 👀💀`;
    } else {
      responseText = `${scrollHours} GHANTE?! Chronic Doomscroller ho Chuke ho beta! Padhai tumhara wait kar rahi hai jaise tum crush ke replay ka wait karte ho 💀 Switch off that screen right now!`;
    }

    setTimeout(() => {
      setChatLog(prev => [
        ...prev,
        { sender: 'user', text: `I scrolled social media for ${scrollHours} hours today.` },
        { sender: 'bot', text: responseText, mode: 'Savage Burn' }
      ]);
      setOrbState('talking');
      setIsTyping(false);
      
      if (autoSpeak) {
        speakText(responseText);
      }
      
      setTimeout(() => setOrbState('idle'), 2500);
    }, 400);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    setChatLog(prev => [...prev, { sender: 'user', text: textToSend }]);
    setChatInput('');
    setOrbState('burning');
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          scrollHours: scrollHours,
          focusMinutes: focusMinutes,
          streak: streak,
          mood: aiMood,
          customPrompt: customPrompt,
          customTraits: customTraits
        })
      });

      const data = await res.json();
      if (data && data.text) {
        setChatLog(prev => [
          ...prev,
          { sender: 'bot', text: data.text, mode: data.mood || "Savage Reply" }
        ]);
        setOrbState('talking');
        
        if (autoSpeak) {
          speakText(data.text);
        }
      } else {
        throw new Error("No text returned");
      }
    } catch (error) {
      console.error("Error communicating with Savage Sentinel API:", error);
      
      // Dynamic local offline simulation handler based on queries and chosen mood
      let responseText = "";
      let mood = "Savage Reply";
      const query = textToSend.toLowerCase();

      if (customPrompt || customTraits) {
        const customAdlib = customTraits 
          ? `[Simulated ${customTraits.split(',')[0]} Mode]` 
          : "[Simulated Custom Target]";
        responseText = `${customAdlib} Understood your custom setup! As you directed me to prioritize "${customPrompt || customTraits}", let's crush your Class 10 syllabus right now. Close extra screens and let's get focused! ✨`;
        mood = "Custom Aura Lab";
      } else if (aiMood === 'helpful') {
        mood = "Helpful Guide 🧠";
        if (query.includes('lazy') || query.includes('scrolling') || query.includes('procrastinate')) {
          responseText = "Hey, it looks like you are struggling to stay focused and scrolling instead. No worries, let's start small. Try declaring a 10-minute focus span, keep your phone far away, and revise just one chapter topic. You can do this!";
        } else if (query.includes('reality') || query.includes('check')) {
          responseText = "Here is a gentle reality check: CBSE Board exams are critical milestones, and consistent daily practice is key. Try checking today's list inside Study Plan card and spend 15 minutes reviewing formulas.";
        } else if (query.includes('topper') || query.includes('motivation')) {
          responseText = "Toppers excel because they establish small, regular study habits rather than relying on bursts of motivation. Try practicing one trigonometric identity or chemical balanced equation right now!";
        } else {
          responseText = "I'm here to help you guide your revision strategy! Try asking me about study schedules, boards advice, formulas, or how to break down your Science backlog.";
        }
      } else if (aiMood === 'motivational') {
        mood = "Warrior Fuel 🔥";
        if (query.includes('lazy') || query.includes('scrolling') || query.includes('procrastinate')) {
          responseText = "Your study streak has immense power, and today is your battleground! Shut down the scroll now and let your inner warrior take command! Rise up and build your elite future! ⚡";
        } else if (query.includes('reality') || query.includes('check')) {
          responseText = "A real warrior checks their gear every day. Look at your streak meter, grab your pen, and write your success story today. Close the noise and step into your zone! 🏆";
        } else {
          const randomMot = motivations[Math.floor(Math.random() * motivations.length)];
          responseText = randomMot.text;
          mood = randomMot.mood;
        }
      } else {
        // Sarcastic
        if (query.includes('lazy') || query.includes('scrolling') || query.includes('procrastinate') || query.includes('kl') || query.includes('lazy?')) {
          responseText = "Bhai lazy hone ka toh custom program chal raha hai lagta hai. 2 minute padhne baitho aur phone automatic hath me chipak jata hai! Dimag ko thoda dente maaro aur Focus timer lagao badmash! 😭";
          mood = "Aura Reality Shock";
        } else if (query.includes('reality') || query.includes('check')) {
          responseText = "Reality check? Yeh lo: Topper banne ka dream hai, par alarm snooze karne me record tod rakha hai. Future me default alert sound ki tarah ignore hona hai toh sote raho! 💀";
          mood = "Cold Punch";
        } else if (query.includes('topper') || query.includes('motivation')) {
          const randomMot = motivations[Math.floor(Math.random() * motivations.length)];
          responseText = randomMot.text;
          mood = randomMot.mood;
        } else if (query.includes('shayari') || query.includes('shayri')) {
          responseText = "Humne toh socha tha beta ki itihas rachaoge... par reel dekhte dekhte khud ka kabaad banaoge 😭 Aree abhi bhi waqt hai, aura sudharo aur topper ban k dikhao!";
          mood = "Meme Shayari";
        } else {
          const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
          responseText = `Dekho, main tumhare is random sawaal ka answer deta... par pehle ye batao ki study timer start kiya ya nahi? Chalo mai direct bolta hu: ${randomRoast.text}`;
          mood = "Witty Sentinel";
        }
      }

      setChatLog(prev => [
        ...prev,
        { sender: 'bot', text: responseText, mode: mood }
      ]);
      setOrbState('talking');
      
      if (autoSpeak) {
        speakText(responseText);
      }
    } finally {
      setIsTyping(false);
      setTimeout(() => setOrbState('idle'), 2500);
    }
  };

  const isLightTheme = themeId === 'morning' || themeId === 'afternoon' || themeId === 'minimal';

  const textBase = isLightTheme ? 'text-slate-800' : 'text-slate-100';
  const textTitle = isLightTheme ? 'text-slate-900' : 'text-white';
  const textMute = isLightTheme ? 'text-slate-500' : 'text-slate-400';
  const bgPanel = isLightTheme ? 'bg-white/90 border-slate-200/60 shadow-md' : 'bg-white/5 border-white/10 shadow-2xl';
  const bgInnerPanel = isLightTheme ? 'bg-slate-100 border-slate-200/60' : 'bg-[#020617]/40 border-white/5';
  const textChatBot = isLightTheme ? 'text-slate-800' : 'text-slate-200';
  const inputBg = isLightTheme ? 'bg-slate-100 text-slate-950 border-slate-300 focus:border-indigo-400 placeholder-slate-400' : 'bg-[#020617]/40 text-white border-white/10 focus:border-fuchsia-500/40 placeholder-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className={`pb-32 space-y-6 pt-4 px-4 max-w-sm mx-auto select-none font-sans ${textBase}`}
    >
      {/* HEADER TITLE EMBLEM */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.3)]">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className={`text-sm font-bold tracking-tight ${textTitle} leading-tight`}>SENTINEL_AI</h2>
            <p className="text-[9px] font-mono tracking-widest text-fuchsia-500 font-bold uppercase">SYS_MOTIVATOR_ROAST</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-1 rounded-full">
          <Flame className="w-3.5 h-3.5 text-fuchsia-500 animate-pulse" />
          <span className="text-[9px] font-mono text-fuchsia-500 font-bold uppercase">SAVAGE LEVEL: MAX</span>
        </div>
      </div>

      {/* THE GLOWING DYNAMIC ORB MODULE */}
      <div className={`relative rounded-[32px] border p-6 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${bgPanel}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent pointer-events-none" />
        
        {/* Floating background neon dust circles */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-fuchsia-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative w-36 h-36 flex items-center justify-center mb-4">
          {/* External pulsating halo */}
          <motion.div
            animate={{
              scale: orbState === 'burning' ? [1, 1.3, 1] : [1, 1.12, 1],
              opacity: orbState === 'burning' ? [0.6, 0.9, 0.6] : [0.4, 0.6, 0.4],
            }}
            transition={{ duration: orbState === 'burning' ? 1.2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 rounded-full bg-gradient-to-tr from-fuchsia-600/30 to-blue-500/20 blur-xl`}
          />

          {/* Core Orb */}
          <motion.div 
            animate={{
              y: orbState === 'talking' ? [0, -6, 0] : [0, -3, 0],
              rotate: orbState === 'burning' ? 360 : [0, 180, 360],
            }}
            transition={{
              y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: orbState === 'burning' ? 3 : 15, repeat: Infinity, ease: 'linear' }
            }}
            className={`w-24 h-24 rounded-full bg-gradient-to-tr from-fuchsia-500 via-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-[0_0_40px_rgba(217,70,239,0.45)] relative cursor-pointer`}
            onClick={triggerRandomRoast}
          >
            {/* Visual Glass Inner overlay */}
            <div className={`w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md ${isLightTheme ? 'bg-white/95' : 'bg-[#020617]/90'}`}>
              <Sparkles className={`w-8 h-8 ${orbState === 'burning' ? 'text-fuchsia-400 rotate-12 scale-110' : isLightTheme ? 'text-slate-400' : 'text-slate-300'} transition-all duration-300`} />
              
              {/* Particle flow */}
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1">
                <span className="w-1 h-1 rounded-full bg-fuchsia-400 animate-ping" />
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-ping delay-100" />
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping delay-200" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Display Current Savage Quote */}
        <div className="w-full text-center space-y-1 relative z-10 px-2">
          <div className="inline-block bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-0.5 rounded-full text-[8px] font-mono text-fuchsia-500 font-bold uppercase tracking-wider">
            {activeRoast.mood}
          </div>
          <p className={`text-sm font-sans font-bold tracking-tight leading-relaxed transition-all duration-300 pt-1 ${textTitle}`}>
            "{activeRoast.text}"
          </p>
        </div>

        {/* Action Button Orbs */}
        <div className="w-full grid grid-cols-2 gap-3 mt-5 relative z-10">
          <button
            id="btn_savage_roast"
            onClick={triggerRandomRoast}
            className="py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-sans font-bold text-xs shadow-[0_4px_15px_rgba(217,70,239,0.35)] hover:scale-102 active:scale-97 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" /> ROAST ME 💀
          </button>
          
          <button
            id="btn_switch_focus"
            onClick={() => onTabChange('focus')}
            className={`py-3 rounded-2xl border text-xs font-sans font-bold uppercase hover:scale-102 active:scale-97 transition-all flex items-center justify-center gap-1 cursor-pointer ${isLightTheme ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-white'}`}
          >
            <Zap className="w-3.5 h-3.5 text-fuchsia-500 animate-pulse" /> TRY FOCUS ⏱️
          </button>
        </div>
      </div>

      {/* COACH PERSONALITY SPEECH LAB */}
      <div className={`relative rounded-[32px] border p-5 transition-all duration-300 overflow-hidden text-left ${bgPanel}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsConfigExpanded(!isConfigExpanded)}>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-fuchsia-400" />
            <div>
              <span className="text-[10px] font-mono tracking-widest text-fuchsia-400 font-bold uppercase">COACH_LAB</span>
              <h3 className={`text-xs font-sans font-extrabold mt-0.5 ${textTitle}`}>Personality & Indian Voice Config</h3>
            </div>
          </div>
          <button 
            type="button" 
            className={`text-xs px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              isLightTheme 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                : 'bg-white/5 hover:bg-white/10 text-slate-400'
            }`}
          >
            {isConfigExpanded ? "Hide Config" : "Setup Traits"}
          </button>
        </div>

        {isConfigExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t border-white/5">
            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Pick Personality Style Presets:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: "👴 Strict HOD", traits: "Strict Bangalore College HOD style, very stern, speaks with boards discipline demands" },
                  { name: "🤝 Chill Bro", traits: "Supportive college senior, friendly, mixed Hindi-English student slang" },
                  { name: "💻 Tech Mentor", traits: "Bangalore Software Architect, uses code syntax terms, performance metrics, and agile goals" },
                  { name: "🔥 Sher Warrior", traits: "Extremely high motivation, royal warrior status metaphors, fierce and heroic" }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setCustomTraits(preset.traits);
                      setCustomPrompt(`Adopt a persona matching ${preset.name}. Incorporate typical phrases relative to this character.`);
                    }}
                    className={`text-[10px] font-sans font-bold px-2 py-1.5 rounded-xl border text-left flex items-center justify-between transition-all hover:scale-101 active:scale-99 cursor-pointer ${
                      isLightTheme
                        ? 'bg-slate-50 border-slate-200 hover:bg-indigo-50 text-slate-700'
                        : 'bg-white/3 border-white/5 hover:bg-fuchsia-950/20 text-slate-300'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Traits Text Inputs */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="input_custom_traits" className="text-[9px] font-mono text-slate-400 uppercase font-bold block">
                Describe Traits (e.g. strict, uses regional terms):
              </label>
              <input
                id="input_custom_traits"
                type="text"
                placeholder="e.g. Strict but funny math teacher, says 'no excuses'"
                value={customTraits}
                onChange={(e) => setCustomTraits(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-sans outline-none border transition-all ${inputBg}`}
              />
            </div>

            {/* Custom Rules / Constraints Text Inputs */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="input_custom_prompt" className="text-[9px] font-mono text-slate-400 uppercase font-bold block">
                Custom System Prompt Rules (Directives):
              </label>
              <textarea
                id="input_custom_prompt"
                rows={2}
                placeholder="e.g. Always start with 'Namaste Champion!' and translate technical words into very simple analogies."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs font-sans outline-none border transition-all resize-none ${inputBg}`}
              />
            </div>

            {/* Speech synthesis Indian accent segment */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">🇮🇳 Indian Male Speak Accent:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    autoSpeak 
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                      : 'bg-white/5 text-slate-500 border border-transparent'
                  }`}
                >
                  {autoSpeak ? "ON (Auto)" : "OFF"}
                </button>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal">
                Converts bot replies into speech. Click below to test or configure manually.
              </p>
              
              <button
                type="button"
                id="btn_test_speech_synth"
                onClick={() => speakText("Hey board champion! Welcome back. Stop scrolling and let's conquer your syllabus today!")}
                className="w-full py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[10px] font-mono uppercase font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" /> Preview Indian Voice Sample
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DYNAMIC DOOMSCROLL HORIZONS SLIDER */}
      <div className={`relative rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-3 text-left">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-blue-400 font-bold uppercase">DOOMSCROL_INTENSITY</span>
            <h3 className={`text-sm font-sans font-extrabold mt-0.5 ${textTitle}`}>Wasted Scrolling Hours?</h3>
          </div>
          <span className="text-lg font-mono text-blue-400 font-bold">{scrollHours} hrs</span>
        </div>

        <div className="space-y-4">
          <input
            id="slider_wasted_scrolling"
            type="range"
            min="0"
            max="10"
            step="1"
            value={scrollHours}
            onChange={(e) => setScrollHours(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer bg-white/10 h-1 rounded-lg"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
            <span>0 (Innocent Saint)</span>
            <span>5 (Average Student)</span>
            <span>10 (Meme Champion 👑)</span>
          </div>

          <button
            id="btn_roast_scrolled_hours"
            onClick={triggerCustomScrollRoast}
            className="w-full py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/25 text-xs font-sans font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertCircle className="w-4 h-4" /> REVEAL SCROLLING ROAST 💀
          </button>
        </div>
      </div>

      {/* DESI MULTILINGUAL MOTIVATION MODULE */}
      <div className={`relative rounded-[32px] border p-5 transition-all duration-300 ${bgPanel} overflow-hidden text-left`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-orange-500/5 to-transparent pointer-events-none" />
        
        {/* Module Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase">DESI_AURA_BOOSTER</span>
            <h3 className={`text-sm font-sans font-extrabold mt-0.5 ${textTitle}`}>Hindi & Hinglish Quotes</h3>
          </div>
          <div className="flex gap-1.5">
            {/* Language Pill Selector */}
            <button
              id="lang_selector_hinglish"
              onClick={() => {
                setDesiLanguage('hinglish');
                fetchDesiQuote('hinglish', desiTone);
              }}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                desiLanguage === 'hinglish' 
                  ? 'bg-amber-500 text-[#020617] shadow-sm' 
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white'
              }`}
            >
              Hinglish
            </button>
            <button
              id="lang_selector_hindi"
              onClick={() => {
                setDesiLanguage('hindi');
                fetchDesiQuote('hindi', desiTone);
              }}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                desiLanguage === 'hindi' 
                  ? 'bg-amber-500 text-[#020617] shadow-sm' 
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Tone Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            id="tone_selector_serious"
            onClick={() => {
              setDesiTone('serious');
              fetchDesiQuote(desiLanguage, 'serious');
            }}
            className={`py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer ${
              desiTone === 'serious'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/3 border border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3 h-3 text-cyan-400" /> Serious
          </button>
          <button
            id="tone_selector_funny"
            onClick={() => {
              setDesiTone('funny');
              fetchDesiQuote(desiLanguage, 'funny');
            }}
            className={`py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer ${
              desiTone === 'funny'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/3 border border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile className="w-3 h-3 text-yellow-400" /> Funny
          </button>
          <button
            id="tone_selector_angry"
            onClick={() => {
              setDesiTone('angry');
              fetchDesiQuote(desiLanguage, 'angry');
            }}
            className={`py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer ${
              desiTone === 'angry'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/3 border border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-orange-500 animate-pulse" /> Gusse Mein 😡
          </button>
          <button
            id="tone_selector_roasting"
            onClick={() => {
              setDesiTone('roasting');
              fetchDesiQuote(desiLanguage, 'roasting');
            }}
            className={`py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer ${
              desiTone === 'roasting'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/3 border border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Skull className="w-3 h-3 text-purple-400" /> Roasting 💀
          </button>
          <button
            id="tone_selector_energetic"
            onClick={() => {
              setDesiTone('energetic');
              fetchDesiQuote(desiLanguage, 'energetic');
            }}
            className={`py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer ${
              desiTone === 'energetic'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/3 border border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" /> Energetic
          </button>
          <button
            id="tone_selector_calm"
            onClick={() => {
              setDesiTone('calm');
              fetchDesiQuote(desiLanguage, 'calm');
            }}
            className={`py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer ${
              desiTone === 'calm'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/3 border border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3 h-3 text-emerald-400" /> Calm
          </button>
          <button
            id="tone_selector_warrior"
            onClick={() => {
              setDesiTone('warrior');
              fetchDesiQuote(desiLanguage, 'warrior');
            }}
            className={`py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-250 col-span-2 sm:col-span-2 cursor-pointer ${
              desiTone === 'warrior'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/3 border border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3 h-3 text-rose-400" /> Warrior
          </button>
        </div>

        {/* Quote Panel Card */}
        <div className={`relative rounded-2xl border p-4 mb-4 flex flex-col justify-center min-h-[90px] overflow-hidden ${bgInnerPanel}`}>
          <AnimatePresence mode="wait">
            {loadingDesi ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-2 py-2"
              >
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-[9px] font-mono text-slate-500 uppercase">Consulting Desi Coach AI...</span>
              </motion.div>
            ) : (
              <motion.div
                key="quote"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <p className={`text-xs font-sans font-bold leading-relaxed italic ${textTitle}`}>
                  "{desiQuote}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Generate Button */}
        <button
          id="btn_fetch_new_desi_quote"
          onClick={() => fetchDesiQuote(desiLanguage, desiTone)}
          disabled={loadingDesi}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-slate-900 font-sans font-extrabold text-xs shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-900 ${loadingDesi ? 'animate-spin' : ''}`} />
          NAYA QUOTE CHAHIYE ✨
        </button>
      </div>

      {/* CHATBOT SENTINEL EXPERIENCE CONTAINER */}
      <div className={`relative rounded-[32px] border p-5 flex flex-col h-[320px] overflow-hidden transition-all duration-300 ${bgPanel}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
        
        {/* Chat Log View */}
        <div className="flex-1 overflow-y-auto space-y-3.5 mb-3.5 pr-1 scrollbar-none text-left">
          {chatLog.map((chat, idx) => (
            <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8px] font-mono text-slate-500">
                  {chat.sender === 'user' ? 'VETERAN_STUDENT' : 'AURA_SENTINEL_AI'}
                </span>
                {chat.mode && (
                  <span className="text-[7px] font-mono bg-fuchsia-500/10 text-fuchsia-400 px-1 py-0.2 rounded font-semibold">
                    {chat.mode}
                  </span>
                )}
              </div>
              <div className="flex items-stretch gap-1.5 max-w-[85%]">
                <div className={`rounded-2xl px-3.5 py-2.5 text-xs font-sans leading-relaxed ${
                  chat.sender === 'user' 
                    ? 'bg-gradient-to-l from-purple-500 to-indigo-600 text-white rounded-tr-none shadow-md' 
                    : `border ${isLightTheme ? 'bg-slate-100 border-slate-200 text-slate-850' : 'bg-white/5 border-white/5 text-slate-200'} rounded-tl-none`
                }`}>
                  {chat.text}
                </div>
                {chat.sender === 'bot' && (
                  <button
                    type="button"
                    onClick={() => speakText(chat.text)}
                    className={`p-2 rounded-xl border flex items-center justify-center self-end hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                      isLightTheme 
                        ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm' 
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-fuchsia-400'
                    }`}
                    title="Speak using Indian male voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex flex-col items-start">
              <span className="text-[8px] font-mono text-slate-500 mb-0.5">AURA_SENTINEL_AI typing...</span>
              <div className={`border rounded-2xl p-2 px-3.5 flex gap-1 items-center ${isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Presets */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-shrink-0">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handleSendMessage(preset)}
              className={`flex-shrink-0 border rounded-full px-3 py-1 text-[9px] font-sans transition-colors cursor-pointer ${
                isLightTheme 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                  : 'bg-white/3 hover:bg-white/8 border border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Chat Form Input */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(chatInput);
          }}
          className="relative flex items-center gap-1.5 mt-1.5 flex-shrink-0"
        >
          {/* AI Active Mood Custom Dropdown */}
          <select
            id="select_ai_mood"
            value={aiMood}
            onChange={(e) => setAiMood(e.target.value as any)}
            className={`rounded-xl px-2.5 py-2 text-[10px] font-sans font-bold outline-none cursor-pointer border transition-all ${
              isLightTheme 
                ? 'bg-slate-100 text-slate-800 border-slate-300 focus:border-indigo-400' 
                : 'bg-slate-950/80 text-slate-200 border-white/10 focus:border-fuchsia-500/40'
            }`}
          >
            <option value="sarcastic">💀 Sarcastic</option>
            <option value="helpful">🧠 Helpful</option>
            <option value="motivational">🔥 Motive</option>
          </select>

          <input
            id="input_savage_prompt"
            type="text"
            placeholder={getPlaceholder()}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className={`flex-1 min-w-0 rounded-xl px-4 py-2 text-xs font-sans outline-none transition-all ${inputBg}`}
          />
          <button
            id="btn_submit_savage_prompt"
            type="submit"
            className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer flex-shrink-0 shadow-[0_4px_10px_rgba(217,70,239,0.25)]"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
