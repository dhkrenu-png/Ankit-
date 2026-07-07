/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Check, Plus, Trash2, Clock, 
  Sparkles, Bell, Award, BookOpen, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, LogOut,
  ListTodo, PlusCircle, CheckCircle2, Circle, Settings, LayoutGrid, Info, CheckSquare
} from 'lucide-react';
import { CalendarEvent, EventType } from '../types';
import { initAuth, googleSignIn, logout } from '../lib/googleAuth';

interface CalendarTabProps {
  key?: string;
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'completed'>) => void;
  onToggleEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (updated: CalendarEvent) => void;
}

export default function CalendarTab({
  events,
  onAddEvent,
  onToggleEvent,
  onDeleteEvent,
  onUpdateEvent
}: CalendarTabProps) {
  // Dynamic Real-time Date and clock tracking
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Update local clock and refresh every 15 seconds to sync dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  // Format Helper: YYYY-MM-DD
  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayStr = useMemo(() => formatDateString(currentTime), [currentTime]);

  // Initial Calendar State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [tabView, setTabView] = useState<'month' | 'week' | 'day' | 'agenda' | 'tasks'>('month');
  
  // Sunday or Monday start setting
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'Sunday' | 'Monday'>('Sunday');

  // Currently browsed Month/Year
  const [browseMonth, setBrowseMonth] = useState<number>(() => currentTime.getMonth());
  const [browseYear, setBrowseYear] = useState<number>(() => currentTime.getFullYear());

  // Form states for creating a new task
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('task');
  const [newTime, setNewTime] = useState('09:00');
  const [newNotes, setNewNotes] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newRecurring, setNewRecurring] = useState<'none' | 'daily' | 'weekly'>('none');
  const [showAddForm, setShowAddForm] = useState(false);

  // Drag-and-drop state
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [activeDragTarget, setActiveDragTarget] = useState<string | null>(null);

  // Google Integration states
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  // Google Tasks states
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [googleTasks, setGoogleTasks] = useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [syncDest, setSyncDest] = useState<'none' | 'calendar' | 'tasks'>('none');
  const [localAlert, setLocalAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Initialize and check Google Session
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        fetchGoogleEvents(accessToken);
        fetchTaskLists(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setGoogleEvents([]);
        setTaskLists([]);
        setGoogleTasks([]);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLocalAlert(null);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        fetchGoogleEvents(res.accessToken);
        fetchTaskLists(res.accessToken);
        setLocalAlert({ message: "Successfully connected Google Account!", type: "success" });
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.friendlyMessage) {
        setLocalAlert({ message: err.friendlyMessage, type: "error" });
      } else if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        setLocalAlert({
          message: "Google Sign-In was closed or blocked. Since you are in the AI Studio preview iframe, browsers isolate cookies/popups. To authorize successfully, please click 'Open in a New Tab ↗' at the very top right of your screen and sign in there!",
          type: "error"
        });
      } else {
        setLocalAlert({ message: `Google Sign-In failed: ${err.message}`, type: "error" });
      }
    }
  };

  const handleGoogleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out and disconnect your Google Account (Calendar and Tasks)?');
    if (confirmed) {
      await logout();
      setUser(null);
      setToken(null);
      setGoogleEvents([]);
      setTaskLists([]);
      setGoogleTasks([]);
    }
  };

  const fetchGoogleEvents = async (accessToken: string) => {
    setIsLoadingGoogle(true);
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=30&singleEvents=true&orderBy=startTime', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        const mapped: CalendarEvent[] = items.map((item: any) => {
          const startDateTime = item.start?.dateTime || item.start?.date || '';
          const dateOnly = startDateTime.substring(0, 10) || todayStr;
          const timeOnly = item.start?.dateTime ? startDateTime.substring(11, 16) : undefined;
          return {
            id: `google-${item.id}`,
            title: item.summary || 'Untitled Event',
            date: dateOnly,
            type: (item.summary?.toLowerCase().includes('exam') || item.summary?.toLowerCase().includes('test')) ? 'exam' : 'task',
            completed: false,
            time: timeOnly,
            notes: item.description || 'Synced from Google Calendar',
            priority: 'medium'
          };
        });
        setGoogleEvents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch Google events:', err);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const fetchTaskLists = async (accessToken: string) => {
    setIsLoadingLists(true);
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const lists = data.items || [];
        setTaskLists(lists);
        if (lists.length > 0 && !selectedListId) {
          setSelectedListId(lists[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch task lists:', err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const fetchGoogleTasks = async (accessToken: string, listId: string) => {
    if (!listId) return;
    setIsLoadingTasks(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleTasks(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch Google tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (token && selectedListId) {
      fetchGoogleTasks(token, selectedListId);
    }
  }, [selectedListId, token]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !token || !selectedListId) return;

    setIsAddingTask(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          status: 'needsAction'
        })
      });

      if (res.ok) {
        setNewTaskTitle('');
        fetchGoogleTasks(token, selectedListId);
      }
    } catch (err) {
      console.error('Failed to add task to Google Tasks:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleGoogleTask = async (task: any) => {
    if (!token || !selectedListId) return;
    
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    const msg = newStatus === 'completed' 
      ? `Mark task "${task.title}" as completed in Google Tasks?` 
      : `Mark task "${task.title}" as active in Google Tasks?`;
    
    const confirmed = window.confirm(msg);
    if (!confirmed) return;

    try {
      setGoogleTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          status: newStatus,
          notes: task.notes || ''
        })
      });

      if (!res.ok) {
        fetchGoogleTasks(token, selectedListId);
      }
    } catch (err) {
      console.error('Failed to update Google Task:', err);
      fetchGoogleTasks(token, selectedListId);
    }
  };

  const handleDeleteGoogleTask = async (taskId: string, taskTitle: string) => {
    if (!token || !selectedListId) return;

    const confirmed = window.confirm(`Are you sure you want to delete the Google Task "${taskTitle}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setGoogleTasks(prev => prev.filter(t => t.id !== taskId));

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        fetchGoogleTasks(token, selectedListId);
      }
    } catch (err) {
      console.error('Failed to delete Google Task:', err);
      fetchGoogleTasks(token, selectedListId);
    }
  };

  // Google + Local merged events
  const combinedEvents = useMemo(() => {
    return [...events, ...googleEvents];
  }, [events, googleEvents]);

  // Handle previous/next month triggers (No hardcoding, fully dynamic)
  const handlePrevMonth = () => {
    if (browseMonth === 0) {
      setBrowseMonth(11);
      setBrowseYear(prev => prev - 1);
    } else {
      setBrowseMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (browseMonth === 11) {
      setBrowseMonth(0);
      setBrowseYear(prev => prev + 1);
    } else {
      setBrowseMonth(prev => prev + 1);
    }
  };

  // Current Browse Month Data
  const currentMonthName = useMemo(() => {
    const tempDate = new Date(browseYear, browseMonth, 1);
    return tempDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }, [browseMonth, browseYear]);

  const totalDaysInMonth = useMemo(() => {
    // Calculates number of days dynamically, naturally handling leap years!
    return new Date(browseYear, browseMonth + 1, 0).getDate();
  }, [browseMonth, browseYear]);

  const startDayOffset = useMemo(() => {
    // Get day index of the first of the month
    const firstDay = new Date(browseYear, browseMonth, 1).getDay(); // Sunday is 0, Monday is 1...
    if (firstDayOfWeek === 'Sunday') {
      return firstDay;
    } else {
      return firstDay === 0 ? 6 : firstDay - 1;
    }
  }, [browseMonth, browseYear, firstDayOfWeek]);

  // Calendar cells generation
  const calendarGrids = useMemo(() => {
    const grids = [];
    // Padding for offset
    for (let i = 0; i < startDayOffset; i++) {
      grids.push(null);
    }
    // Days of month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      grids.push(d);
    }
    return grids;
  }, [startDayOffset, totalDaysInMonth]);

  // Day list generator for Week View
  const weekDaysList = useMemo(() => {
    const selected = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = selected.getDay();
    let diff = 0;
    if (firstDayOfWeek === 'Sunday') {
      diff = -dayOfWeek;
    } else {
      diff = -(dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    }

    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() + diff);

    const daysList = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      daysList.push(day);
    }
    return daysList;
  }, [selectedDate, firstDayOfWeek]);

  // Retrieve events for a specific target date string (supports recurring logic)
  const getEventsForDate = (dateString: string) => {
    const dateObj = new Date(dateString + 'T00:00:00');
    const targetTime = dateObj.getTime();

    return combinedEvents.filter(ev => {
      if (ev.date === dateString) return true;
      if (!ev.recurring || ev.recurring === 'none') return false;

      // Filter out events starting in the future
      const eventStartObj = new Date(ev.date + 'T00:00:00');
      if (eventStartObj.getTime() > targetTime) return false;

      if (ev.recurring === 'daily') return true;
      if (ev.recurring === 'weekly') {
        return eventStartObj.getDay() === dateObj.getDay();
      }
      return false;
    });
  };

  // Events filtered for the selected day
  const dateEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [selectedDate, combinedEvents]);

  const handleDaySelect = (day: number) => {
    const formattedStr = `${browseYear}-${(browseMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(formattedStr);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddEvent({
      title: newTitle,
      date: selectedDate,
      type: newType,
      time: newTime || undefined,
      notes: newNotes || undefined,
      priority: newPriority,
      recurring: newRecurring
    });

    if (token) {
      if (syncDest === 'calendar') {
        const confirmed = window.confirm(`Would you like to sync this study task "${newTitle}" to your Google Calendar?`);
        if (confirmed) {
          try {
            const startStr = `${selectedDate}T${newTime || '09:00'}:00`;
            const startDate = new Date(startStr);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
            
            await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                summary: newTitle,
                description: newNotes || 'Added via Zenith OS',
                start: {
                  dateTime: startDate.toISOString(),
                  timeZone: userTimezone
                },
                end: {
                  dateTime: endDate.toISOString(),
                  timeZone: userTimezone
                }
              })
            });
            fetchGoogleEvents(token);
          } catch (err) {
            console.error('Failed to sync event to Google Calendar:', err);
          }
        }
      } else if (syncDest === 'tasks' && selectedListId) {
        const confirmed = window.confirm(`Would you like to sync this study task "${newTitle}" to your Google Tasks list?`);
        if (confirmed) {
          try {
            await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                title: newTitle,
                notes: newNotes || 'Created via Zenith OS',
                status: 'needsAction'
              })
            });
            fetchGoogleTasks(token, selectedListId);
          } catch (err) {
            console.error('Failed to sync to Google Tasks:', err);
          }
        }
      }
    }

    setNewTitle('');
    setNewNotes('');
    setSyncDest('none');
    setNewPriority('medium');
    setNewRecurring('none');
    setShowAddForm(false);
  };

  const handleDeleteEventClick = async (id: string, title: string) => {
    if (id.startsWith('google-')) {
      const confirmed = window.confirm(`Delete event "${title}" from Google Calendar? This action cannot be undone.`);
      if (!confirmed) return;
      
      if (token) {
        const googleId = id.replace('google-', '');
        try {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          setGoogleEvents(prev => prev.filter(e => e.id !== id));
        } catch (err) {
          console.error('Failed to delete Google event:', err);
        }
      }
    } else {
      onDeleteEvent(id);
    }
  };

  // HTML5 Native Drag & Drop Rescheduling helpers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.setData('text/plain', event.id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setActiveDragTarget(targetId);
  };

  const handleDragLeave = () => {
    setActiveDragTarget(null);
  };

  const handleDropOnDay = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setActiveDragTarget(null);
    if (!draggedEvent) return;

    if (draggedEvent.id.startsWith('google-')) {
      alert("Google items can only be rescheduled directly via the connected Google suite.");
      return;
    }

    const updated: CalendarEvent = {
      ...draggedEvent,
      date: targetDateStr
    };
    onUpdateEvent(updated);
    setDraggedEvent(null);
  };

  const handleDropOnTime = (e: React.DragEvent, targetTimeStr: string) => {
    e.preventDefault();
    setActiveDragTarget(null);
    if (!draggedEvent) return;

    if (draggedEvent.id.startsWith('google-')) {
      alert("Google items can only be rescheduled directly via the connected Google suite.");
      return;
    }

    const updated: CalendarEvent = {
      ...draggedEvent,
      time: targetTimeStr
    };
    onUpdateEvent(updated);
    setDraggedEvent(null);
  };

  // Day View chronological timeline hourly blocks
  const dayTimelineHours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  const getEventsForTimelineSlot = (hourStr: string, dayEventsList: CalendarEvent[]) => {
    const slotHour = parseInt(hourStr.split(':')[0], 10);
    return dayEventsList.filter(ev => {
      if (!ev.time) return false;
      const evHour = parseInt(ev.time.split(':')[0], 10);
      return evHour >= slotHour && evHour < slotHour + 2;
    });
  };

  // Aesthetic and visual label maps
  const typeLabels: Record<EventType, { label: string; bg: string; text: string; icon: any }> = {
    task: { label: 'Study Task', bg: 'bg-[#0f2d2b]', text: 'text-teal-400', icon: BookOpen },
    exam: { label: 'Exam Block', bg: 'bg-[#3b1216]', text: 'text-rose-400', icon: AlertCircle },
    reminder: { label: 'Reminder', bg: 'bg-[#121c3b]', text: 'text-blue-400', icon: Bell },
    goal: { label: 'Aura Goal', bg: 'bg-[#2b123b]', text: 'text-purple-400', icon: Award }
  };

  const priorityMeta = {
    low: { label: 'Low', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-500/5' },
    medium: { label: 'Medium', color: 'text-amber-400 border-amber-400/20 bg-amber-500/5' },
    high: { label: 'High', color: 'text-rose-400 border-rose-400/30 bg-rose-500/10 shadow-[0_0_8px_rgba(244,63,94,0.1)]' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="pb-32 pt-4 px-4 max-w-sm mx-auto select-none text-left font-sans"
    >
      {/* HEADER TABS SCREEN */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-sm font-mono tracking-widest text-teal-400 flex items-center gap-1.5 font-bold uppercase">
            <CalendarIcon className="w-4 h-4 text-teal-400 animate-pulse" /> ZENITH CALENDAR
          </h2>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              🕒 {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[8px] font-mono text-slate-500 uppercase">
              🌐 {userTimezone}
            </span>
          </div>
        </div>
        
        {/* View mode toggle */}
        <div className="flex rounded-lg bg-white/5 border border-white/5 p-0.5">
          {['month', 'week', 'day', 'agenda', 'tasks'].map((view) => (
            <button
              key={view}
              onClick={() => setTabView(view as any)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                tabView === view ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* GOOGLE CLOUD LINK PANEL (CALENDAR + TASKS) */}
      <div className="rounded-[28px] bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 p-4 mb-4 text-left shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.15),transparent_60%)] pointer-events-none" />
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-[9px] font-mono tracking-widest text-teal-400 uppercase font-bold">Google Cloud Link</span>
          </div>
        </div>

        {localAlert && (
          <div className={`p-3 mb-3.5 rounded-xl border flex items-start gap-2.5 transition-all duration-300 relative ${
            localAlert.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
            localAlert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
            'bg-sky-500/10 border-sky-500/20 text-sky-300'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="flex-1 text-[10px] leading-relaxed font-sans text-left">
              {localAlert.message}
            </div>
            <button 
              onClick={() => setLocalAlert(null)}
              className="text-[10px] font-bold text-slate-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
        )}

        {!user ? (
          <div className="space-y-3">
            <p className="text-[10px] font-sans text-slate-300 leading-normal">
              Link your actual Google Account to view and schedule study blocks, exam alerts, and manage Google Tasks directly in real-time.
            </p>

            {window.self !== window.top && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[9.5px] leading-relaxed font-sans flex flex-col gap-1 text-left">
                <span className="font-bold flex items-center gap-1 text-[10px] text-amber-400">⚠️ Iframe Environment Active</span>
                <span>
                  Browsers block Firebase Auth popups inside iframes. If clicking below doesn't open the login, please click 
                  <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="font-black underline mx-1 hover:text-amber-200">
                    Open in a New Tab ↗
                  </a> 
                  at the top of AI Studio, then connect your account!
                </span>
              </div>
            )}

            <button
              id="gsi_sign_in_btn"
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer min-h-[40px]"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Connect Google Account</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-7 h-7 rounded-full border border-teal-500"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="text-left leading-none">
                  <p className="text-[10px] font-sans font-bold text-slate-100">{user.displayName}</p>
                  <p className="text-[8px] font-mono text-teal-400 mt-0.5">Cloud Connected</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  id="btn_refresh_google"
                  type="button"
                  onClick={() => {
                    if (token) {
                      fetchGoogleEvents(token);
                      fetchTaskLists(token);
                    }
                  }}
                  disabled={isLoadingGoogle || isLoadingLists}
                  className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 transition-all cursor-pointer"
                  title="Force Sync Now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGoogle || isLoadingLists ? 'animate-spin' : ''}`} />
                </button>
                <button
                  id="btn_logout_google"
                  type="button"
                  onClick={handleGoogleLogout}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <p className="text-[9px] font-mono text-emerald-400 text-center animate-pulse">
              ● Cloud Connected: Calendar & {taskLists.length} Task Lists Active
            </p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* MONTH VIEW */}
        {tabView === 'month' && (
          <motion.div
            key="month_panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl overflow-hidden relative"
          >
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={handlePrevMonth} 
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <h3 className="text-sm font-sans font-semibold text-white tracking-wide">{currentMonthName}</h3>
              
              <button 
                onClick={handleNextMonth} 
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Week Alignment Selector Setting */}
            <div className="flex justify-between items-center mb-3 bg-white/2 p-2 rounded-xl border border-white/5">
              <span className="text-[9px] font-mono text-slate-400">Week Alignment:</span>
              <button
                onClick={() => setFirstDayOfWeek(firstDayOfWeek === 'Sunday' ? 'Monday' : 'Sunday')}
                className="text-[9px] font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded hover:bg-teal-500/20 transition"
              >
                {firstDayOfWeek} start
              </button>
            </div>

            {/* Weekdays Labels */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono text-slate-500 font-bold border-b border-white/5 pb-2">
              {firstDayOfWeek === 'Sunday' ? (
                ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <span key={i}>{day}</span>)
              ) : (
                ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <span key={i}>{day}</span>)
              )}
            </div>

            {/* Dynamic Grid Cells with HTML5 drop zone rescheduling */}
            <div className="grid grid-cols-7 gap-1.5 text-center mt-3 text-xs font-mono">
              {calendarGrids.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }

                const dateStr = `${browseYear}-${(browseMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const isToday = todayStr === dateStr;

                const dayEvents = getEventsForDate(dateStr);
                const dayHasTasks = dayEvents.length > 0;
                const dayHasCompletedAll = dayHasTasks && dayEvents.every(e => e.completed);

                const isDragOver = activeDragTarget === dateStr;

                return (
                  <button
                    id={`day_button_${day}`}
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(dateStr)}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnDay(e, dateStr)}
                    className={`relative aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-tr from-teal-500/30 to-emerald-500/30 text-teal-100 border border-teal-500/40 font-bold shadow-[0_0_12px_rgba(20,184,166,0.35)]'
                        : isToday
                        ? 'bg-white/5 text-teal-400 border border-teal-500/30 font-bold'
                        : isDragOver
                        ? 'bg-teal-500/20 border-2 border-dashed border-teal-400 scale-105'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{day}</span>

                    {/* Small priority / status dots */}
                    {dayHasTasks && (
                      <span className="absolute bottom-1 flex gap-0.5 justify-center">
                        {dayEvents.map((ev, eidx) => {
                          let dotColor = 'bg-teal-400';
                          if (ev.priority === 'high') dotColor = 'bg-rose-400';
                          else if (ev.priority === 'medium') dotColor = 'bg-amber-400';
                          else if (ev.priority === 'low') dotColor = 'bg-emerald-400';
                          return (
                            <span 
                              key={eidx} 
                              className={`w-1 h-1 rounded-full ${dayHasCompletedAll ? 'bg-emerald-400/50' : dotColor} shadow-sm`} 
                            />
                          );
                        })}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* WEEK VIEW */}
        {tabView === 'week' && (
          <motion.div
            key="week_panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono tracking-widest text-teal-400 uppercase font-bold">7-Day Weekly Stream</span>
              <span className="text-[8px] font-mono text-slate-500">Drag items to reschedule days</span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {weekDaysList.map((day, index) => {
                const dateStr = formatDateString(day);
                const isSelected = selectedDate === dateStr;
                const isToday = todayStr === dateStr;
                const dayEvents = getEventsForDate(dateStr);
                const isDragOver = activeDragTarget === dateStr;

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(dateStr)}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnDay(e, dateStr)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-teal-500/10 border-teal-500/30 shadow-[0_0_8px_rgba(20,184,166,0.15)]' 
                        : isToday
                        ? 'bg-white/5 border-teal-500/20'
                        : isDragOver
                        ? 'bg-teal-500/20 border-2 border-dashed border-teal-400'
                        : 'bg-white/2 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-sans font-bold text-slate-100">
                        {day.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {isToday && <span className="ml-1.5 text-[8px] bg-teal-500/20 text-teal-300 font-mono font-bold px-1 rounded">TODAY</span>}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{dayEvents.length} Tasks</span>
                    </div>

                    {dayEvents.length === 0 ? (
                      <p className="text-[10px] font-sans text-slate-600 italic">No schedules for today.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {dayEvents.map(ev => {
                          const priorityColor = ev.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                                ev.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/20' :
                                                'bg-emerald-500/20 text-emerald-300 border-emerald-500/20';
                          return (
                            <span 
                              key={ev.id} 
                              className={`text-[9px] px-2 py-0.5 rounded-md border max-w-full truncate ${priorityColor} ${ev.completed ? 'opacity-40 line-through' : ''}`}
                            >
                              {ev.time ? `[${ev.time}] ` : ''}{ev.title}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* DAY VIEW (CHRONOLOGICAL TIMELINE) */}
        {tabView === 'day' && (
          <motion.div
            key="day_panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-teal-400 uppercase font-bold">Hourly Timeline Matrix</span>
                <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                  Showing: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className="text-[8px] font-mono text-slate-500">Drag events to schedule times</span>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {dayTimelineHours.map((hour) => {
                const hourEvents = getEventsForTimelineSlot(hour, dateEvents);
                const isDragOver = activeDragTarget === hour;

                return (
                  <div
                    key={hour}
                    onDragOver={(e) => handleDragOver(e, hour)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnTime(e, hour)}
                    className={`p-2.5 rounded-xl border flex gap-3 text-left items-start transition-all ${
                      isDragOver
                        ? 'bg-teal-500/20 border-2 border-dashed border-teal-400'
                        : 'bg-white/2 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 w-10 shrink-0 font-bold">{hour}</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      {hourEvents.length === 0 ? (
                        <span className="text-[9px] font-sans text-slate-600 block italic">Free Slot</span>
                      ) : (
                        hourEvents.map(ev => {
                          const priorityColor = ev.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                                ev.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/20' :
                                                'bg-emerald-500/20 text-emerald-300 border-emerald-500/20';
                          return (
                            <div 
                              key={ev.id} 
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, ev)}
                              className={`p-1.5 rounded-lg border text-[10px] font-semibold flex justify-between items-center cursor-move ${priorityColor}`}
                            >
                              <span className="truncate">{ev.title}</span>
                              <span className="text-[8px] font-mono opacity-80 shrink-0 ml-1">({ev.time})</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* AGENDA VIEW */}
        {tabView === 'agenda' && (
          <motion.div
            key="agenda_panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl relative max-h-[360px] overflow-y-auto"
          >
            <h3 className="text-xs font-mono tracking-widest text-slate-400 uppercase mb-3">ALL SCHEDULED ITEMS</h3>
            <div className="space-y-3">
              {combinedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs font-sans text-teal-400/90 leading-relaxed max-w-[200px] mx-auto">
                    "No events scheduled. Plan your next milestone."
                  </p>
                </div>
              ) : (
                combinedEvents.map(ev => {
                  const Label = typeLabels[ev.type] || typeLabels.task;
                  const Priority = priorityMeta[ev.priority || 'medium'];
                  return (
                    <div
                      id={`agenda_item_${ev.id}`}
                      key={ev.id}
                      onClick={() => !ev.id.startsWith('google-') && onToggleEvent(ev.id)}
                      className="p-3 bg-white/2 hover:bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 transition-all cursor-pointer text-left"
                    >
                      <div className={`mt-0.5 rounded-lg p-1.5 ${Label.bg} ${Label.text}`}>
                        <Label.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-sans font-semibold leading-tight truncate ${ev.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {ev.title}
                          </p>
                          <span className="text-[8px] font-mono text-slate-500 shrink-0 ml-2">{ev.date}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center mt-1.5 text-[9px] font-mono text-slate-400 text-left font-sans">
                          {ev.time && <span className="flex items-center gap-0.5 text-teal-400 font-mono"><Clock className="w-2.5 h-2.5" /> {ev.time}</span>}
                          <span>&bull;</span>
                          <span className="uppercase font-mono">{Label.label}</span>
                          <span>&bull;</span>
                          <span className={`px-1 rounded border uppercase text-[8px] ${Priority.color}`}>{Priority.label}</span>
                          {ev.recurring && ev.recurring !== 'none' && (
                            <>
                              <span>&bull;</span>
                              <span className="text-purple-400 font-bold uppercase text-[8px]">🔁 {ev.recurring}</span>
                            </>
                          )}
                          {ev.id.startsWith('google-') && <span className="text-teal-400 font-bold uppercase ml-auto font-mono">GOOGLE CLOUD</span>}
                          {!ev.id.startsWith('google-') && ev.completed && <span className="text-emerald-400 font-bold uppercase ml-auto font-mono">COMPLETE</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE TASKS VIEW */}
        {tabView === 'tasks' && (
          <motion.div
            key="tasks_panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl relative min-h-[300px] text-left"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono tracking-widest text-teal-400 flex items-center gap-1.5 font-bold uppercase">
                <ListTodo className="w-4 h-4 text-teal-400" /> GOOGLE TASKS
              </h3>
              {user && taskLists.length > 0 && (
                <select
                  id="select_tasks_list"
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="bg-slate-900/80 text-slate-200 border border-white/10 rounded-lg px-2 py-1 text-[10px] outline-none max-w-[150px] font-mono cursor-pointer"
                >
                  {taskLists.map(l => (
                    <option key={l.id} value={l.id} className="bg-[#0e1633] text-slate-100 font-sans">
                      {l.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {!user ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="p-3 bg-white/5 rounded-full border border-white/5">
                  <ListTodo className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-xs font-sans text-slate-400 max-w-[240px]">
                  Connect your Google Account to manage and sync tasks directly within Zenith OS.
                </p>
                <button
                  id="btn_connect_gsi_tasks"
                  onClick={handleGoogleLogin}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold font-sans tracking-wide cursor-pointer transition-all active:scale-95"
                >
                  Connect Google
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add Quick Task Inline form */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    id="input_quick_task_title"
                    type="text"
                    placeholder="Create a new Google task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-white/5 text-slate-200 placeholder-slate-500 border border-white/5 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-teal-500 outline-none font-sans"
                    disabled={isAddingTask}
                  />
                  <button
                    id="btn_quick_add_task"
                    type="submit"
                    className="p-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/20 text-teal-400 cursor-pointer transition-all flex items-center justify-center min-w-[34px] min-h-[34px]"
                    disabled={isAddingTask || !newTaskTitle.trim()}
                  >
                    {isAddingTask ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </form>

                {/* Tasks list */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {isLoadingTasks ? (
                    <div className="flex justify-center items-center py-12">
                      <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                    </div>
                  ) : googleTasks.length === 0 ? (
                    <p className="text-xs font-sans text-slate-500 italic text-center py-8">
                      No tasks in this list. Use the input above to add one!
                    </p>
                  ) : (
                    googleTasks.map(task => {
                      const isCompleted = task.status === 'completed';
                      return (
                        <div
                          id={`google_task_item_${task.id}`}
                          key={task.id}
                          className="p-3 bg-white/2 hover:bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 transition-all text-left group"
                        >
                          <button
                            id={`btn_toggle_gtask_${task.id}`}
                            type="button"
                            onClick={() => handleToggleGoogleTask(task)}
                            className="mt-0.5 text-slate-500 hover:text-teal-400 transition-colors cursor-pointer"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-sans font-semibold leading-tight truncate ${isCompleted ? 'line-through text-slate-500 font-medium' : 'text-slate-100'}`}>
                              {task.title}
                            </p>
                            {task.notes && (
                              <p className="text-[10px] font-sans text-slate-400 mt-1 line-clamp-2 leading-tight">
                                {task.notes}
                              </p>
                            )}
                          </div>

                          <button
                            id={`btn_delete_gtask_${task.id}`}
                            type="button"
                            onClick={() => handleDeleteGoogleTask(task.id, task.title)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Delete Google Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED DAILY GOALS & ADD ROUTINE SLIDE */}
      <div className="relative mt-5 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
        <div className="flex justify-between items-center mb-3 relative z-10">
          <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            TARGETS FOR: {selectedDate}
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
              className="space-y-3 overflow-hidden border-b border-white/5 pb-4 mb-4 text-left"
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
                    className="w-full bg-slate-900 text-slate-200 border border-white/5 rounded-xl px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  >
                    <option value="task">Study Task</option>
                    <option value="exam">Exam Block</option>
                    <option value="reminder">Reminder</option>
                    <option value="goal">Aura Goal</option>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1">PRIORITY</label>
                  <select
                    id="select_event_priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full bg-slate-900 text-slate-200 border border-white/5 rounded-xl px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1">RECURRING</label>
                  <select
                    id="select_event_recurring"
                    value={newRecurring}
                    onChange={(e) => setNewRecurring(e.target.value as 'none' | 'daily' | 'weekly')}
                    className="w-full bg-slate-900 text-slate-200 border border-white/5 rounded-xl px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
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

              {token && (
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1">CLOUD SYNC DESTINATION</label>
                  <select
                    id="select_sync_dest"
                    value={syncDest}
                    onChange={(e) => setSyncDest(e.target.value as 'none' | 'calendar' | 'tasks')}
                    className="w-full bg-slate-900 text-slate-200 border border-white/5 rounded-xl px-2.5 py-1.5 text-[11px] focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  >
                    <option value="none">Local Only</option>
                    <option value="calendar">Google Calendar</option>
                    {taskLists.length > 0 && (
                      <option value="tasks">Google Tasks</option>
                    )}
                  </select>
                </div>
              )}

              <button
                id="btn_submit_event"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-sans text-[11px] font-bold tracking-widest uppercase shadow-[0_4px_10px_rgba(20,184,166,0.3)] hover:opacity-90 active:scale-97 transition-all cursor-pointer min-h-[40px]"
              >
                SAVE STUDY EVENT
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Listing items with HTML5 Drag support */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {dateEvents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs font-sans text-teal-400/90 leading-relaxed max-w-[200px] mx-auto">
                "No events scheduled. Plan your next milestone."
              </p>
            </div>
          ) : (
            dateEvents.map((item) => {
              const textClass = item.completed ? 'line-through text-slate-500' : 'text-slate-100';
              const Label = typeLabels[item.type] || typeLabels.task;
              const Priority = priorityMeta[item.priority || 'medium'];

              return (
                <div
                  id={`event_row_${item.id}`}
                  key={item.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, item)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing select-none text-left"
                >
                  <div
                    onClick={() => !item.id.startsWith('google-') && onToggleEvent(item.id)}
                    className="flex-1 flex items-center gap-2.5 min-w-0 cursor-pointer text-left"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      item.id.startsWith('google-')
                        ? 'bg-teal-500/20 border-teal-500/50'
                        : item.completed 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'border-slate-500 hover:border-slate-200'
                    }`}>
                      {item.id.startsWith('google-') ? (
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                      ) : (
                        item.completed && <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>

                    <div className="min-w-0 leading-tight text-left">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-sans font-medium truncate ${textClass}`}>
                          {item.title}
                        </p>
                        <span className={`text-[8px] font-mono px-1 rounded uppercase shrink-0 ${Priority.color}`}>
                          {Priority.label}
                        </span>
                        {item.recurring && item.recurring !== 'none' && (
                          <span className="text-[8px] text-purple-400 shrink-0">🔁 {item.recurring}</span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-[9px] text-slate-500 truncate mt-0.5 font-light text-left">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & info details */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.time && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/10 uppercase">
                        {item.time}
                      </span>
                    )}
                    <button
                      id={`btn_delete_event_${item.id}`}
                      onClick={() => handleDeleteEventClick(item.id, item.title)}
                      className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-white/5 hover:scale-105 transition-all cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
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
