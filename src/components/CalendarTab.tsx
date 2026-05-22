/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Check, Plus, Trash2, Clock, 
  Sparkles, Bell, Award, BookOpen, AlertCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { CalendarEvent, EventType } from '../types';

interface CalendarTabProps {
  key?: string;
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'completed'>) => void;
  onToggleEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
}

export default function CalendarTab({
  events,
  onAddEvent,
  onToggleEvent,
  onDeleteEvent
}: CalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState('2026-05-20'); // aligned with metadata time (May 20, 2026)
  const [tabView, setTabView] = useState<'month' | 'agenda'>('month');
  
  // Create New Goal form inputs
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('task');
  const [newTime, setNewTime] = useState('09:00');
  const [newNotes, setNewNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Month stats (May 2026)
  const currentMonthName = 'May 2026';
  const totalDays = 31;
  const startDayOffset = 5; // Friday (May 1st, 2026, starts on Friday, offset of 5 with Sunday=0)

  // Generate blank grids for calendar alignment
  const calendarGrids = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarGrids.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarGrids.push(d);
  }

  const handleDaySelect = (day: number) => {
    const formattedStr = `2026-05-${day.toString().padStart(2, '0')}`;
    setSelectedDate(formattedStr);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddEvent({
      title: newTitle,
      date: selectedDate,
      type: newType,
      time: newTime || undefined,
      notes: newNotes || undefined
    });

    setNewTitle('');
    setNewNotes('');
    setShowAddForm(false);
  };

  // Filter events for selected day & upcoming schedules
  const dateEvents = events.filter(e => e.date === selectedDate);
  const typeLabels: Record<EventType, { label: string; bg: string; text: string; icon: any }> = {
    task: { label: 'Study Task', bg: 'bg-[#0f2d2b]', text: 'text-teal-400', icon: BookOpen },
    exam: { label: 'Exam Block', bg: 'bg-[#3b1216]', text: 'text-rose-400', icon: AlertCircle },
    reminder: { label: 'Reminder', bg: 'bg-[#121c3b]', text: 'text-blue-400', icon: Bell },
    goal: { label: 'Aura Goal', bg: 'bg-[#2b123b]', text: 'text-purple-400', icon: Award }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="pb-32 pt-4 px-4 max-w-sm mx-auto select-none"
    >
      {/* HEADER TABS SCREEN */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-sm font-mono tracking-widest text-teal-400 flex items-center gap-1.5 font-bold uppercase">
            <Calendar className="w-4 h-4 text-teal-400" /> ACADEMIC CALENDAR
          </h2>
          <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">May 20, 2026 Dashboard</p>
        </div>
        
        {/* View mode toggle */}
        <div className="flex rounded-lg bg-white/5 border border-white/5 p-0.5">
          <button
            id="tab_btn_month"
            onClick={() => setTabView('month')}
            className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              tabView === 'month' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Grid
          </button>
          <button
            id="tab_btn_agenda"
            onClick={() => setTabView('agenda')}
            className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              tabView === 'agenda' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tabView === 'month' ? (
          <motion.div
            key="grid_panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl overflow-hidden relative"
          >
            {/* Header selection labels */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-sans font-semibold text-white tracking-wide">{currentMonthName}</h3>
              <span className="text-[10px] font-mono bg-white/5 px-2.5 py-0.5 rounded border border-white/5 text-slate-400 uppercase">CURRENT DATE</span>
            </div>

            {/* Weeks titles */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono text-slate-500 font-bold border-b border-white/5 pb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-7 gap-1.5 text-center mt-3 text-xs font-mono">
              {calendarGrids.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }

                const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const isToday = day === 20; // May 20, 2026 is current simulated day

                // Mark circles if day has entries
                const dayHasTasks = events.some(e => e.date === dateStr);
                const dayHasCompletedAll = dayHasTasks && events.filter(e => e.date === dateStr).every(e => e.completed);

                return (
                  <button
                    id={`day_button_${day}`}
                    key={`day-${day}`}
                    onClick={() => handleDaySelect(day)}
                    className={`relative aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-tr from-teal-500/30 to-emerald-500/30 text-teal-100 border border-teal-500/40 font-bold shadow-[0_0_12px_rgba(20,184,166,0.35)]'
                        : isToday
                        ? 'bg-white/5 text-teal-400 border border-white/10 font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{day}</span>

                    {/* Small glowing task marker node */}
                    {dayHasTasks && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                        dayHasCompletedAll ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-rose-400 shadow-[0_0_4px_#f43f5e]'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="agenda_panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl relative max-h-[360px] overflow-y-auto"
          >
            <h3 className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-3">ALL SCHEDULED ITEMS</h3>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-xs font-sans text-slate-500 italic text-center py-6">No study schedules booked.</p>
              ) : (
                events.map(ev => {
                  const Label = typeLabels[ev.type];
                  return (
                    <div
                      id={`agenda_item_${ev.id}`}
                      key={ev.id}
                      onClick={() => onToggleEvent(ev.id)}
                      className="p-3 bg-white/2 hover:bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 transition-all cursor-pointer"
                    >
                      <div className={`mt-0.5 rounded-lg p-1.5 ${Label.bg} ${Label.text}`}>
                        <Label.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-sans font-semibold leading-tight truncate ${ev.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {ev.title}
                          </p>
                          <span className="text-[8px] font-mono text-slate-500 shrink-0 ml-2">{ev.date.replace('2026-05-', 'May ')}</span>
                        </div>
                        <div className="flex gap-2 items-center mt-1.5 text-[9px] font-mono text-slate-400">
                          {ev.time && <span className="flex items-center gap-0.5 text-teal-400"><Clock className="w-2.5 h-2.5" /> {ev.time}</span>}
                          <span>&bull;</span>
                          <span className="uppercase">{Label.label}</span>
                          {ev.completed && <span className="text-emerald-400 font-bold uppercase ml-auto">COMPLETE</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED DAILY GOALS & ADD ROUTINE SLIDE */}
      <div className="relative mt-5 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-3 relative z-10">
          <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            TARGETS FOR: {selectedDate.replace('2026-05-', 'MAY ')}
          </p>

          <button
            id="btn_toggle_form"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[10px] font-mono text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            {showAddForm ? 'COLLAPSE' : '+ ADD STUDY TASK'}
          </button>
        </div>

        {/* Dynamic add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              onSubmit={handleFormSubmit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 overflow-hidden border-b border-white/5 pb-4 mb-4"
            >
              <div>
                <input
                  id="input_event_title"
                  type="text"
                  placeholder="Task title (e.g. Physics Homework)..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 text-slate-200 placeholder-slate-500 border border-white/5 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1">EVENT TYPE</label>
                  <select
                    id="select_event_type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full bg-white/5 text-slate-200 border border-white/5 rounded-xl px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  >
                    <option value="task" className="bg-[#0e1633] text-slate-100">Study Task</option>
                    <option value="exam" className="bg-[#0e1633] text-slate-100">Exam Block</option>
                    <option value="reminder" className="bg-[#0e1633] text-slate-100">Reminder</option>
                    <option value="goal" className="bg-[#0e1633] text-slate-100">Aura Goal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1">SCHEDULE TIME</label>
                  <input
                    id="input_event_time"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white/5 text-slate-200 border border-white/5 rounded-xl px-2 py-1 text-[11px] focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <input
                  id="input_event_notes"
                  type="text"
                  placeholder="Additional subtasks or notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white/5 text-slate-200 placeholder-slate-500 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] focus:ring-1 focus:ring-teal-500 outline-none font-sans"
                />
              </div>

              <button
                id="btn_submit_event"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-sans text-[11px] font-bold tracking-widest uppercase shadow-[0_4px_10px_rgba(20,184,166,0.3)] hover:opacity-90 active:scale-97 transition-all cursor-pointer min-h-[44px]"
              >
                SAVE STUDY EVENT
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Listing items */}
        <div className="space-y-2 max-h-[160px] overflow-y-auto">
          {dateEvents.length === 0 ? (
            <p className="text-xs font-sans text-slate-400 italic text-center py-4">
              All quiet for today. No events scheduled.
            </p>
          ) : (
            dateEvents.map((item) => {
              const textClass = item.completed ? 'line-through text-slate-500' : 'text-slate-100';
              const Label = typeLabels[item.type];

              return (
                <div
                  id={`event_row_${item.id}`}
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all select-none"
                >
                  <div
                    onClick={() => onToggleEvent(item.id)}
                    className="flex-1 flex items-center gap-2.5 min-w-0 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      item.completed 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'border-slate-500 hover:border-slate-200'
                    }`}>
                      {item.completed && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>

                    <div className="min-w-0 leading-tight">
                      <p className={`text-xs font-sans font-medium truncate ${textClass}`}>
                        {item.title}
                      </p>
                      {item.notes && (
                        <p className="text-[9px] text-slate-500 truncate mt-0.5 font-light">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & info details */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.time && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/10 uppercase">
                        {item.time}
                      </span>
                    )}
                    <button
                      id={`btn_delete_event_${item.id}`}
                      onClick={() => onDeleteEvent(item.id)}
                      className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-white/5 hover:scale-105 transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
