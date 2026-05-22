/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Home, Timer, Calendar, Music, Bot, User } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export default function BottomNavbar({ activeTab, onTabChange }: BottomNavbarProps) {
  const tabs = [
    { id: 'home' as AppTab, label: 'Home', icon: Home, color: 'text-cyan-400' },
    { id: 'focus' as AppTab, label: 'Focus', icon: Timer, color: 'text-purple-400' },
    { id: 'calendar' as AppTab, label: 'Calendar', icon: Calendar, color: 'text-teal-400' },
    { id: 'music' as AppTab, label: 'Music', icon: Music, color: 'text-pink-400' },
    { id: 'ai' as AppTab, label: 'Aura AI', icon: Bot, color: 'text-fuchsia-400' },
    { id: 'profile' as AppTab, label: 'Profile', icon: User, color: 'text-indigo-400' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-40 select-none">
      <div className="relative rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 px-4 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Underlay glow reflecting current theme color split */}
        <div className="absolute inset-x-0 bottom-[-5px] h-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-teal-500/20 blur-sm" />

        <div className="flex items-center justify-between relative z-10">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                id={`nav_btn_${tab.id}`}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative py-2 px-3 flex flex-col items-center justify-center cursor-pointer flex-1 transition-all group touch-manipulation min-h-[48px]"
              >
                {/* Active Pill Slider */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}

                {/* Main Icon */}
                <div className="relative flex items-center justify-center">
                  <IconComponent
                    className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? `${tab.color} drop-shadow-[0_0_8px_currentColor]` : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  
                  {/* Subtle pulsing active light */}
                  {isActive && (
                    <motion.div
                      className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${
                        tab.id === 'home' ? 'bg-cyan-400' :
                        tab.id === 'focus' ? 'bg-purple-400' :
                        tab.id === 'calendar' ? 'bg-teal-400' :
                        tab.id === 'music' ? 'bg-pink-400' :
                        tab.id === 'ai' ? 'bg-fuchsia-400' : 'bg-indigo-400'
                      }`}
                      layoutId="activeTabDot"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Subtitle Label Description */}
                <span
                  className={`text-[9px] font-sans tracking-wider mt-1 transition-all duration-300 ${
                    isActive ? 'text-white font-medium scale-100' : 'text-slate-500 font-normal scale-95 group-hover:text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
