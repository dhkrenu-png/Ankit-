export type AppTab = 'home' | 'focus' | 'calendar' | 'music' | 'ai' | 'profile';

export type EventType = 'task' | 'exam' | 'reminder' | 'goal';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  completed: boolean;
  time?: string;
  notes?: string;
}

export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  coverGradient: string;
  category: 'lofi' | 'ambient' | 'chill' | 'frequency';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  unlockedAt?: string;
}

export interface FocusStreak {
  current: number;
  best: number;
  totalFocusTime: number; // in minutes
  completedSessions: number;
}

export interface AIAssistantState {
  advice: string;
  loading: boolean;
  mood: string;
  suggestions: string[];
}
