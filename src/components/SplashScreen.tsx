/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  key?: string;
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    'Initializing Zenith Neural Core...',
    'Activating Hyper-Focus Engine & Atomic Progress matrices...',
    'Deploying ML-based Guardian Filter notification shield...',
    'Synching Sentinel AI Savage Personality matrices...',
    'Aura refraction modules synchronized. ZENITH is ready.'
  ];

  // Particle generation
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 2,
    duration: Math.random() * 4 + 3
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Stagger text loading steps based on progress
    const stepIdx = Math.min(
      Math.floor((progress / 100) * loadingSteps.length),
      loadingSteps.length - 1
    );
    setCurrentStep(stepIdx);
  }, [progress]);

  return (
    <div className="fixed inset-0 bg-[#070b19] flex flex-col items-center justify-center overflow-hidden z-50 select-none">
      {/* Cinematic grid overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(18,24,48,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,48,0.3)_1px,transparent_1px)] bg-[size:32px_32px]"
        style={{
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-blue-400/40 blur-[0.5px]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: ['0vh', '-100vh'],
              opacity: [0, 0.8, 0],
              x: [`${p.x}%`, `${p.x + (Math.random() * 10 - 5)}%`]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Core HUD Visualizer */}
      <div className="relative flex flex-col items-center justify-center z-10 w-full max-w-sm px-6">
        {/* Pulsing Concentric Outer Rings */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 border border-cyan-500/20 rounded-full"
            animate={{ scale: [1, 1.2, 1], rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute -inset-4 border border-purple-500/10 border-dashed rounded-full"
            animate={{ scale: [1, 0.95, 1], rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          />

          {/* Core App Shield Logo */}
          <motion.div 
            className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#141f45]/90 to-[#0e1633]/90 shadow-[0_0_40px_rgba(34,211,238,0.25)] border border-cyan-500/40 flex items-center justify-center overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {/* Gloss reflection shimmer */}
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/5 skew-y-12 translate-y-[-10px]" />

            <div className="relative">
              <Cpu className="w-10 h-10 text-cyan-400" />
              <motion.div
                className="absolute inset-x-[-4px] bottom-[-2px] h-[2px] bg-purple-500 blur-[1px]"
                animate={{ opacity: [0.3, 1, 0.3], scaleY: [1, 2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>

        {/* Title Header */}
        <motion.div
          className="text-center mt-8 space-y-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-400/20 px-3 py-1 rounded-full mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-cyan-300 font-bold">Cognitive Core Active</span>
          </div>
          <h1 className="text-4xl font-sans tracking-[0.15em] text-white font-extrabold flex flex-col items-center justify-center gap-1 uppercase">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400">ZENITH</span>
            <span className="text-xs font-mono tracking-[0.3em] text-slate-400 font-medium mt-1">THE COGNITIVE OS</span>
          </h1>
          <p className="text-[10px] font-mono italic tracking-wide text-slate-300 max-w-[280px] mx-auto leading-relaxed">
            "Stop existing. Start directing your reality."
          </p>
        </motion.div>

        {/* Progress Bar & Status Text */}
        <div className="w-full mt-10 space-y-4">
          <div className="h-1 bg-[#101938] rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeInOut' }}
            />
            {/* Glow line pointer */}
            <div 
              className="absolute top-0 bottom-0 w-8 bg-cyan-400/40 blur-sm -translate-x-1/2"
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="h-6 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                className="text-center text-[11px] font-mono text-cyan-400/80 tracking-wide flex items-center justify-center gap-1.5"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                {loadingSteps[currentStep]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Enter Trigger Button (Becomes visible when progress reaches 100) */}
        <div className="h-14 mt-6 flex items-center justify-center">
          <AnimatePresence>
            {progress >= 100 && (
              <motion.button
                id="btn_launch_os"
                onClick={onComplete}
                className="px-8 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 text-cyan-100 hover:text-white font-sans text-xs tracking-widest uppercase font-medium hover:from-cyan-500/30 hover:to-indigo-500/30 hover:border-cyan-400/80 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer touch-manipulation min-h-[44px]"
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -15 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Enter Workspace
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
