import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Plus, Search, Trash2, Pin, Send, FolderOpen, FileText, 
  CheckCircle, Paperclip, AlertCircle, Loader2, Sparkles, RefreshCw, 
  File, ExternalLink, ChevronRight, Check, X, Bookmark, Edit3, Circle,
  LayoutGrid, List, Eye
} from 'lucide-react';
import { initAuth, googleSignIn } from '../lib/googleAuth';

interface GoogleDeskProps {
  onAddEvent?: (event: any) => void;
}

interface Note {
  id: number;
  userId: number;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkspaceFile {
  id: number;
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdAt?: string;
}

interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
  body?: string;
}

export default function GoogleDesk({ onAddEvent }: GoogleDeskProps) {
  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sqlUserId, setSqlUserId] = useState<number | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // General views state: 'gmail' | 'keep' | 'drive' | 'sheets'
  const [deskTab, setDeskTab] = useState<'gmail' | 'keep' | 'drive' | 'sheets'>('gmail');

  // Status notification state
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 1. Gmail States
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loadingEmailDetails, setLoadingEmailDetails] = useState(false);
  const [gmailQuery, setGmailQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // 1b. Sheets States
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(null);
  const [selectedSpreadsheetData, setSelectedSpreadsheetData] = useState<any | null>(null);
  const [loadingSpreadsheetDetails, setLoadingSpreadsheetDetails] = useState(false);
  const [currentSheetName, setCurrentSheetName] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number; label: string; currentVal: string } | null>(null);
  const [cellEditValue, setCellEditValue] = useState('');
  const [savingCell, setSavingCell] = useState(false);
  const [creatingSpreadsheet, setCreatingSpreadsheet] = useState(false);
  const [newSpreadsheetTitle, setNewSpreadsheetTitle] = useState('');

  // 2. Google Keep States (SQL)
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('slate'); // slate, indigo, blue, emerald, amber, rose
  const [notePinned, setNotePinned] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [keepQuery, setKeepQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);

  // 3. Drive Explorer States
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveQuery, setDriveQuery] = useState('');
  const [pickedFiles, setPickedFiles] = useState<WorkspaceFile[]>([]);
  const [loadingPicked, setLoadingPicked] = useState(false);

  // Toast status helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  // Auth initialize
  useEffect(() => {
    setAuthChecking(true);
    const unsubscribe = initAuth(
      async (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        if (currentUser && currentUser.uid) {
          await syncUserWithSQL(currentUser.uid, currentUser.email || '');
        }
        setAuthChecking(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setSqlUserId(null);
        setAuthChecking(false);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  // Sync user with SQL backend
  const syncUserWithSQL = async (uid: string, email: string) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email }),
      });
      if (res.ok) {
        const data = await res.json();
        setSqlUserId(data.userId);
        // Load initial data
        fetchNotes(data.userId);
        fetchPickedFiles(data.userId);
      }
    } catch (err) {
      console.error('Error syncing user with Cloud SQL:', err);
    }
  };

  // Google Sign-In Trigger
  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(`Successfully connected Google Account!`, 'success');
        await syncUserWithSQL(res.user.uid, res.user.email || '');
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        showToast(
          `Google Sign-In was cancelled or blocked. Since you are in the AI Studio preview iframe, please open the app in a new tab using the top button to connect!`,
          'error'
        );
      } else {
        showToast(`Login failed: ${err.message}`, 'error');
      }
    }
  };

  // Fetch emails from live Google API
  const fetchEmails = async (searchQuery = '') => {
    if (!token) return;
    setLoadingEmails(true);
    try {
      let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8';
      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Gmail API returned status ${response.status}`);
      }

      const data = await response.json();
      const msgs = data.messages || [];

      // Fetch details for each message in parallel
      const detailedMessages = await Promise.all(
        msgs.map(async (m: { id: string; threadId: string }) => {
          try {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (detailRes.ok) {
              const details = await detailRes.json();
              const headers = details.payload?.headers || [];
              const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
              const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
              const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
              return {
                id: m.id,
                threadId: m.threadId,
                snippet: details.snippet || '',
                subject,
                from,
                date,
                body: parseEmailBody(details.payload),
              };
            }
          } catch (e) {
            console.error('Failed to fetch mail details:', e);
          }
          return { id: m.id, threadId: m.threadId, snippet: 'Details unavailable' };
        })
      );

      setEmails(detailedMessages.filter(Boolean) as EmailMessage[]);
    } catch (err: any) {
      console.error(err);
      showToast('Error syncing Gmail: Check if scopes are permitted or reload', 'error');
    } finally {
      setLoadingEmails(false);
    }
  };

  // Helper to parse Gmail body structure (HTML/Text)
  const parseEmailBody = (payload: any): string => {
    if (!payload) return 'No content';
    if (payload.body?.data) {
      return decodeBase64(payload.body.data);
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return decodeBase64(part.body.data);
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          return decodeBase64(part.body.data);
        }
        if (part.parts) {
          const body = parseEmailBody(part);
          if (body) return body;
        }
      }
    }
    return 'No body readable';
  };

  const decodeBase64 = (data: string) => {
    try {
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(window.atob(base64)));
    } catch (e) {
      return 'Body parsing error';
    }
  };

  // Compose & Send live email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!composeTo || !composeSubject || !composeBody) {
      showToast('All email fields are required', 'info');
      return;
    }
    setSendingEmail(true);
    try {
      const rawEmail = [
        `To: ${composeTo}`,
        `Subject: ${composeSubject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        composeBody
      ].join('\r\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedEmail })
      });

      if (response.ok) {
        showToast('Email sent successfully!', 'success');
        setComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        fetchEmails();
      } else {
        throw new Error('API Send Failed');
      }
    } catch (err) {
      showToast('Failed to send email. Verify recipient and scopes.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // 2. Cloud SQL Notes (Keep Clone)
  const fetchNotes = async (userId: number) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/notes?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqlUserId) return;
    if (!noteContent.trim()) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sqlUserId,
          title: noteTitle,
          content: noteContent,
          color: noteColor,
          isPinned: notePinned
        }),
      });

      if (res.ok) {
        setNoteTitle('');
        setNoteContent('');
        setNoteColor('slate');
        setNotePinned(false);
        showToast('Note created successfully!', 'success');
        fetchNotes(sqlUserId);
      }
    } catch (err) {
      showToast('Failed to save note', 'error');
    }
  };

  const handleUpdateNote = async (noteId: number, fields: Partial<Note>) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...fields } : n));
        if (editingNote && editingNote.id === noteId) {
          setEditingNote(null);
        }
      }
    } catch (err) {
      showToast('Failed to update note', 'error');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        showToast('Note deleted', 'success');
      }
    } catch (err) {
      showToast('Failed to delete note', 'error');
    }
  };

  // 3. Live Google Drive Explorer (Picker Alternate)
  const fetchDriveFiles = async (searchQuery = '') => {
    if (!token) return;
    setLoadingDrive(true);
    try {
      let query = "trashed = false";
      if (searchQuery) {
        query += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      }
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,thumbnailLink,iconLink,webViewLink)&q=${encodeURIComponent(query)}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to explore Google Drive', 'error');
    } finally {
      setLoadingDrive(false);
    }
  };

  const fetchPickedFiles = async (userId: number) => {
    setLoadingPicked(true);
    try {
      const res = await fetch(`/api/workspace-files?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPickedFiles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPicked(false);
    }
  };

  const handlePickFile = async (file: any) => {
    if (!sqlUserId) return;
    try {
      const isAlreadyPicked = pickedFiles.some(f => f.fileId === file.id);
      if (isAlreadyPicked) {
        showToast('File is already picked in your workspace!', 'info');
        return;
      }

      const res = await fetch('/api/workspace-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sqlUserId,
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          iconLink: file.iconLink,
        }),
      });

      if (res.ok) {
        showToast(`Picked and synced file: ${file.name}`, 'success');
        fetchPickedFiles(sqlUserId);
      }
    } catch (err) {
      showToast('Failed to link file to workspace', 'error');
    }
  };

  const handleRemovePickedFile = async (id: number) => {
    try {
      const res = await fetch(`/api/workspace-files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPickedFiles(prev => prev.filter(f => f.id !== id));
        showToast('File removed from workspace', 'success');
      }
    } catch (err) {
      showToast('Failed to remove file', 'error');
    }
  };

  // Google Sheets Workspace API integrations
  const fetchSpreadsheets = async () => {
    if (!token) return;
    setLoadingSpreadsheets(true);
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&maxResults=15`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSpreadsheets(data.files || []);
      } else {
        throw new Error('Failed to fetch spreadsheets');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error loading spreadsheets from Google Workspace.', 'error');
    } finally {
      setLoadingSpreadsheets(false);
    }
  };

  const fetchSpreadsheetDetails = async (spreadsheetId: string) => {
    if (!token) return;
    setLoadingSpreadsheetDetails(true);
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=true`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedSpreadsheetData(data);
        if (data.sheets && data.sheets.length > 0) {
          setCurrentSheetName(data.sheets[0].properties.title);
        }
      } else {
        throw new Error('Failed to load spreadsheet details');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not load cell grids. Ensure correct API permissions.', 'error');
    } finally {
      setLoadingSpreadsheetDetails(false);
    }
  };

  const handleCellUpdate = async () => {
    if (!token || !selectedSpreadsheetId || !editingCell || !currentSheetName) return;
    setSavingCell(true);
    try {
      const range = `${currentSheetName}!${editingCell.label}`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: range,
          majorDimension: 'ROWS',
          values: [[cellEditValue]],
        }),
      });

      if (response.ok) {
        showToast('Cell updated successfully in Google Sheets! ✨', 'success');
        setEditingCell(null);
        await fetchSpreadsheetDetails(selectedSpreadsheetId);
      } else {
        throw new Error('Failed to update cell value');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not save value to spreadsheet.', 'error');
    } finally {
      setSavingCell(false);
    }
  };

  const createNewSpreadsheet = async (title: string) => {
    if (!token) return;
    setCreatingSpreadsheet(true);
    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: title || 'Zenith Study Planner',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast('New spreadsheet created successfully! ✨', 'success');
        setNewSpreadsheetTitle('');
        await fetchSpreadsheets();
        setSelectedSpreadsheetId(data.spreadsheetId);
        await fetchSpreadsheetDetails(data.spreadsheetId);
      } else {
        throw new Error('Failed to create sheet');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not create Google Sheet in Drive.', 'error');
    } finally {
      setCreatingSpreadsheet(false);
    }
  };

  // Run initial data queries when connected
  useEffect(() => {
    if (token) {
      if (deskTab === 'gmail') {
        fetchEmails(gmailQuery);
      } else if (deskTab === 'drive') {
        fetchDriveFiles(driveQuery);
      } else if (deskTab === 'sheets') {
        fetchSpreadsheets();
      }
    }
  }, [token, deskTab]);

  const handleGmailSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails(gmailQuery);
  };

  const handleDriveSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDriveFiles(driveQuery);
  };

  // Note color utility classes mapping
  const colorMap: Record<string, { bg: string; border: string; text: string; selectBg: string }> = {
    slate: { bg: 'bg-slate-900/40', border: 'border-slate-700/50', text: 'text-slate-300', selectBg: 'bg-slate-700' },
    indigo: { bg: 'bg-indigo-950/40', border: 'border-indigo-500/50', text: 'text-indigo-200', selectBg: 'bg-indigo-600' },
    blue: { bg: 'bg-blue-950/40', border: 'border-blue-500/50', text: 'text-blue-200', selectBg: 'bg-blue-600' },
    emerald: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', text: 'text-emerald-200', selectBg: 'bg-emerald-600' },
    amber: { bg: 'bg-amber-950/40', border: 'border-amber-500/50', text: 'text-amber-200', selectBg: 'bg-amber-600' },
    rose: { bg: 'bg-rose-950/40', border: 'border-rose-500/50', text: 'text-rose-200', selectBg: 'bg-rose-600' }
  };

  return (
    <div className="w-full min-h-[500px] text-slate-100 flex flex-col relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-xl text-sm font-medium ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' 
                : statusMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                : 'bg-slate-950/90 text-indigo-300 border-indigo-500/50'
            }`}
          >
            {statusMessage.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/5 bg-white/[0.02] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-1.5">
              Google Desk <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase">Zenith Integration</span>
            </h2>
            <p className="text-xs text-slate-400">Authentic sync with Gmail, Google Keep (Cloud SQL), and live Google Drive</p>
          </div>
        </div>

        {/* Authentication Widget */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {authChecking ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying status...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] transition px-3 py-1.5 rounded-xl border border-white/5">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-5 h-5 rounded-full ring-1 ring-indigo-500/30" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-slate-300 max-w-[120px] truncate">{user.displayName || user.email}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-200 transition shadow-lg shadow-white/5"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png" alt="Google" className="w-4 h-4" />
              Connect Account
            </button>
          )}
        </div>
      </div>

      {/* Navigation and Inner Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.01] border-b border-white/5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeskTab('gmail')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              deskTab === 'gmail' 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <Mail size={14} className={deskTab === 'gmail' ? 'text-indigo-400' : ''} />
            <span>Gmail Client</span>
          </button>
          <button
            onClick={() => setDeskTab('keep')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              deskTab === 'keep' 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <Bookmark size={14} className={deskTab === 'keep' ? 'text-amber-400' : ''} />
            <span>Zenith Keep</span>
          </button>
          <button
            onClick={() => setDeskTab('drive')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              deskTab === 'drive' 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <FolderOpen size={14} className={deskTab === 'drive' ? 'text-emerald-400' : ''} />
            <span>Google Drive Picker</span>
          </button>
          <button
            onClick={() => setDeskTab('sheets')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              deskTab === 'sheets' 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <LayoutGrid size={14} className={deskTab === 'sheets' ? 'text-sky-400' : ''} />
            <span>Google Sheets</span>
          </button>
        </div>

        {/* Sync Indicator */}
        {token && (
          <button
            onClick={() => {
              if (deskTab === 'gmail') fetchEmails(gmailQuery);
              if (deskTab === 'drive') fetchDriveFiles(driveQuery);
              if (sqlUserId) {
                fetchNotes(sqlUserId);
                fetchPickedFiles(sqlUserId);
              }
              showToast('Data refreshed!', 'success');
            }}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition"
            title="Force refresh current tab"
          >
            <RefreshCw size={13} className={(loadingEmails || loadingDrive || loadingNotes) ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!token ? (
          /* Disconnected State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full scale-150"></div>
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-slate-400 flex items-center justify-center relative">
                <FolderOpen className="w-12 h-12 text-indigo-400/80" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Connect Google Services</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Authenticate securely with your Google Account to check real emails, manage notes backed up in Cloud SQL, and pick live Google Drive resources directly into your Zenith workspace.
            </p>

            {window.self !== window.top && (
              <div className="p-3 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed font-sans max-w-sm mx-auto text-left flex flex-col gap-1.5">
                <span className="font-bold flex items-center gap-1 text-[13px] text-amber-400">⚠️ Iframe Environment Active</span>
                <span>
                  Browsers isolate cookies and block popups inside preview iframes. If clicking the button below fails or gets blocked, click 
                  <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="font-bold underline mx-1 hover:text-amber-200">
                    Open in a New Tab ↗
                  </a> 
                  at the top of AI Studio, then sign in there.
                </span>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20 border border-indigo-500/30"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png" alt="Google" className="w-4 h-4" />
              Enable Integration Desk
            </button>
          </div>
        ) : (
          <div className="w-full">
            
            {/* ==================================== */}
            {/* GMAIL TAB CLIENT                     */}
            {/* ==================================== */}
            {deskTab === 'gmail' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Mail List & Compose panel */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  
                  {/* Search and Compose bar */}
                  <div className="flex items-center gap-2">
                    <form onSubmit={handleGmailSearchSubmit} className="flex-1 relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search Gmail inbox..."
                        value={gmailQuery}
                        onChange={(e) => setGmailQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white/[0.04] border border-white/10 rounded-xl focus:border-indigo-500/80 outline-none text-white placeholder-slate-500"
                      />
                    </form>
                    <button
                      onClick={() => setComposeOpen(!composeOpen)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <Plus size={14} />
                      <span>Compose</span>
                    </button>
                  </div>

                  {/* Mail Compose Form */}
                  <AnimatePresence>
                    {composeOpen && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSendEmail}
                        className="bg-white/[0.03] border border-white/10 p-4 rounded-xl flex flex-col gap-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                            <Send size={12} /> Send New Email
                          </h4>
                          <button type="button" onClick={() => setComposeOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={14} />
                          </button>
                        </div>
                        <div>
                          <input
                            type="email"
                            placeholder="To (e.g. contact@example.com)"
                            value={composeTo}
                            onChange={(e) => setComposeTo(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-black/30 border border-white/5 rounded-lg text-white outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Subject"
                            value={composeSubject}
                            onChange={(e) => setComposeSubject(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-black/30 border border-white/5 rounded-lg text-white outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <textarea
                            placeholder="Type email body here..."
                            rows={4}
                            value={composeBody}
                            onChange={(e) => setComposeBody(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-black/30 border border-white/5 rounded-lg text-white outline-none focus:border-indigo-500 resize-none font-sans"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={sendingEmail}
                          className="self-end flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                        >
                          {sendingEmail ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          <span>{sendingEmail ? 'Sending...' : 'Send Message'}</span>
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Emails List */}
                  <div className="flex flex-col gap-2 min-h-[250px]">
                    {loadingEmails ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                        <span className="text-xs text-slate-400">Fetching messages securely...</span>
                      </div>
                    ) : emails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-xl">
                        <Mail className="w-8 h-8 text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400">No emails found or matched</p>
                      </div>
                    ) : (
                      emails.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => setSelectedEmail(msg)}
                          className={`p-3 rounded-xl border transition cursor-pointer text-left flex items-start justify-between gap-3 ${
                            selectedEmail?.id === msg.id
                              ? 'bg-indigo-600/10 border-indigo-500/50'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-200 truncate pr-2">{msg.from}</span>
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono">{msg.date ? new Date(msg.date).toLocaleDateString() : ''}</span>
                            </div>
                            <h5 className="text-xs font-medium text-indigo-300 truncate mb-1">{msg.subject}</h5>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{msg.snippet}</p>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 self-center shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Mail Detail Viewer */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-4 min-h-[300px]">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                      <FileText size={12} /> Mail Reader
                    </h4>
                    <p className="text-[10px] text-slate-500">Read and create links or items inside Zenith OS</p>
                  </div>

                  {selectedEmail ? (
                    <div className="flex-1 flex flex-col gap-4 text-left">
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono mb-1">FROM</div>
                        <div className="text-xs font-semibold text-white bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5 select-all">{selectedEmail.from}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono mb-1">SUBJECT</div>
                        <div className="text-xs font-bold text-indigo-300">{selectedEmail.subject}</div>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="text-[10px] text-slate-500 font-mono mb-1">BODY</div>
                        <div className="flex-1 max-h-[250px] overflow-y-auto p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap select-text">
                          {selectedEmail.body || selectedEmail.snippet}
                        </div>
                      </div>

                      {/* Pick as Action */}
                      <button
                        onClick={() => {
                          if (onAddEvent) {
                            onAddEvent({
                              title: `Follow up: ${selectedEmail.subject}`,
                              date: new Date().toISOString().substring(0, 10),
                              type: 'task',
                              time: '12:00',
                              notes: `Mail from ${selectedEmail.from}. Snippet: ${selectedEmail.snippet}`
                            });
                            showToast('Email action linked to Zenith Goals!', 'success');
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition mt-2"
                      >
                        <PlusCircleIcon size={13} />
                        <span>Add as Zenith Goal</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                      <Mail size={24} className="mb-2 opacity-40" />
                      <p className="text-xs">Select any email message to read contents in full</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================================== */}
            {/* ZENITH KEEP TAB                      */}
            {/* ==================================== */}
            {deskTab === 'keep' && (
              <div className="flex flex-col gap-6">
                
                {/* Note Editor Form */}
                <form onSubmit={handleCreateNote} className="max-w-xl mx-auto w-full bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex flex-col gap-3 relative shadow-xl">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Title"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="bg-transparent text-sm font-semibold text-white outline-none placeholder-slate-500 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setNotePinned(!notePinned)}
                      className={`p-1.5 rounded-lg transition ${notePinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      title="Pin note"
                    >
                      <Pin size={14} />
                    </button>
                  </div>
                  <div>
                    <textarea
                      placeholder="Take a note..."
                      rows={2}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="bg-transparent text-xs text-slate-300 outline-none placeholder-slate-500 w-full resize-none font-sans"
                      required
                    />
                  </div>

                  {/* Form bottom controls */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                    {/* Color selectors */}
                    <div className="flex items-center gap-1.5">
                      {Object.keys(colorMap).map((colorKey) => (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setNoteColor(colorKey)}
                          className={`w-4 h-4 rounded-full border transition ${
                            noteColor === colorKey 
                              ? 'border-white scale-125 ring-1 ring-white/20' 
                              : 'border-transparent hover:scale-110'
                          } ${
                            colorKey === 'slate' ? 'bg-slate-700' :
                            colorKey === 'indigo' ? 'bg-indigo-600' :
                            colorKey === 'blue' ? 'bg-blue-600' :
                            colorKey === 'emerald' ? 'bg-emerald-600' :
                            colorKey === 'amber' ? 'bg-amber-600' : 'bg-rose-600'
                          }`}
                          title={`Color: ${colorKey}`}
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-white text-slate-900 font-semibold rounded-xl text-xs hover:bg-slate-200 transition"
                    >
                      Save Note
                    </button>
                  </div>
                </form>

                {/* Search notes and layout selector */}
                <div className="flex items-center justify-between">
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-2 text-slate-400" size={13} />
                    <input
                      type="text"
                      placeholder="Filter notes..."
                      value={keepQuery}
                      onChange={(e) => setKeepQuery(e.target.value)}
                      className="w-full pl-8 pr-4 py-1.5 text-xs bg-white/[0.04] border border-white/5 rounded-xl outline-none focus:border-indigo-500 placeholder-slate-500 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
                    <button
                      onClick={() => setIsGridView(true)}
                      className={`p-1.5 rounded-lg transition ${isGridView ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Grid Layout"
                    >
                      <LayoutGrid size={13} />
                    </button>
                    <button
                      onClick={() => setIsGridView(false)}
                      className={`p-1.5 rounded-lg transition ${!isGridView ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="List Layout"
                    >
                      <List size={13} />
                    </button>
                  </div>
                </div>

                {/* Notes Grid/List Display */}
                {loadingNotes ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                    <span className="text-xs text-slate-400">Loading Zenith Keep notes...</span>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/5 rounded-2xl">
                    <Bookmark className="w-10 h-10 text-slate-600 mb-2" />
                    <h4 className="text-sm font-semibold text-slate-400 mb-1">Aesthetic Empty State</h4>
                    <p className="text-xs text-slate-500 max-w-xs text-center">Capture thoughts, Class 10 formulas, and rapid bullet notes here. Every note is securely persisted in Cloud SQL.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 text-left">
                    {/* Pinned Section */}
                    {notes.some(n => n.isPinned) && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                          <Pin size={10} /> PINNED NOTES
                        </h4>
                        <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                          {notes
                            .filter(n => n.isPinned && (n.title.toLowerCase().includes(keepQuery.toLowerCase()) || n.content.toLowerCase().includes(keepQuery.toLowerCase())))
                            .map(note => renderNoteCard(note))}
                        </div>
                      </div>
                    )}

                    {/* Unpinned Section */}
                    <div>
                      {notes.some(n => n.isPinned) && (
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                          OTHERS
                        </h4>
                      )}
                      <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                        {notes
                          .filter(n => !n.isPinned && (n.title.toLowerCase().includes(keepQuery.toLowerCase()) || n.content.toLowerCase().includes(keepQuery.toLowerCase())))
                          .map(note => renderNoteCard(note))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================================== */}
            {/* GOOGLE DRIVE PICKER / EXPLORER       */}
            {/* ==================================== */}
            {deskTab === 'drive' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                
                {/* Live Drive files list */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                      <FolderOpen size={12} /> Google Drive Explorer
                    </h4>
                    <p className="text-[10px] text-slate-500">Pick live documents and store attachments to your safe Cloud SQL profile</p>
                  </div>

                  {/* Drive Search Bar */}
                  <form onSubmit={handleDriveSearchSubmit} className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search Drive files..."
                      value={driveQuery}
                      onChange={(e) => setDriveQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-white/[0.04] border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-white placeholder-slate-500"
                    />
                    <button type="submit" className="absolute right-2 top-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-slate-300 transition">
                      Search
                    </button>
                  </form>

                  {/* Files container */}
                  {loadingDrive ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                      <span className="text-xs text-slate-400">Loading live Google Drive...</span>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-2xl">
                      <File size={28} className="text-slate-600 mb-2" />
                      <p className="text-xs text-slate-400">Search for files or click to list files from your live Drive</p>
                      <button
                        onClick={() => fetchDriveFiles()}
                        className="mt-4 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[11px] font-semibold text-white transition"
                      >
                        Scan Root Drive
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {file.iconLink ? (
                              <img src={file.iconLink} alt="" className="w-4 h-4" />
                            ) : (
                              <File size={16} className="text-indigo-400" />
                            )}
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-slate-200 truncate pr-2">{file.name}</h5>
                              <p className="text-[10px] text-slate-500 truncate">{file.mimeType}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
                                title="Open original document"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                            <button
                              onClick={() => handlePickFile(file)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition"
                            >
                              Pick File
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cloud SQL Picked Attachments Sidebar */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Paperclip size={12} /> Workspace Attachments
                    </h4>
                    <p className="text-[10px] text-slate-500">Files selected to study or view within Zenith OS</p>
                  </div>

                  {loadingPicked ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    </div>
                  ) : pickedFiles.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <AlertCircle size={20} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No files linked to workspace. Pick some files from your Drive!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto">
                      {pickedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[11px] font-medium text-slate-200 truncate">{file.fileName}</h5>
                            <span className="text-[9px] text-slate-500 font-mono">Linked resource</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition"
                                title="Open Drive Link"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                            <button
                              onClick={() => handleRemovePickedFile(file.id)}
                              className="p-1 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                              title="Remove from Workspace"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ==================================== */}
            {/* GOOGLE SHEETS WORKSPACE INTEGRATION */}
            {/* ==================================== */}
            {deskTab === 'sheets' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
                
                {/* Left Sidebar: Spreadsheet Files Selection & Creation */}
                <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="border-b border-white/5 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-1">
                      <LayoutGrid size={12} /> Google Sheets
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans">Pick or compose live sheets synced with your Google account</p>
                  </div>

                  {/* Create New Spreadsheet Form */}
                  <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                    <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider">Create New Sheet</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Sheet Title..."
                        value={newSpreadsheetTitle}
                        onChange={(e) => setNewSpreadsheetTitle(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg outline-none text-white focus:border-sky-500 placeholder-slate-600"
                      />
                      <button
                        onClick={() => createNewSpreadsheet(newSpreadsheetTitle || 'Zenith Study Planner')}
                        disabled={creatingSpreadsheet}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs transition shrink-0"
                      >
                        {creatingSpreadsheet ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* List of Spreadsheet Files */}
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Select spreadsheet</span>
                    {loadingSpreadsheets ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                      </div>
                    ) : spreadsheets.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-xl">
                        No spreadsheets found. Create one above to get started!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
                        {spreadsheets.map((sheet) => (
                          <button
                            key={sheet.id}
                            onClick={() => {
                              setSelectedSpreadsheetId(sheet.id);
                              fetchSpreadsheetDetails(sheet.id);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition flex items-center gap-2 ${
                              selectedSpreadsheetId === sheet.id
                                ? 'bg-sky-500/10 border-sky-500/40 text-white'
                                : 'bg-white/[0.01] border-white/5 text-slate-300 hover:bg-white/[0.03]'
                            }`}
                          >
                            <img src={sheet.iconLink || 'https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png'} alt="" className="w-4 h-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[11px] font-semibold truncate leading-tight">{sheet.name}</h5>
                              <span className="text-[8.5px] font-mono text-slate-500">Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Grid Viewer and Interactive Cells */}
                <div className="lg:col-span-3 bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col gap-4 relative">
                  
                  {loadingSpreadsheetDetails ? (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-20">
                      <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-2" />
                      <span className="text-xs text-slate-300 font-mono">Synchronizing cell layers...</span>
                    </div>
                  ) : null}

                  {!selectedSpreadsheetId ? (
                    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 rounded-2xl">
                      <img src="https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png" alt="Google Sheets" className="w-12 h-12 mb-3 opacity-60" />
                      <h4 className="text-sm font-bold text-slate-300">No Spreadsheet Selected</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                        Select a spreadsheet from the list or create a brand new one to fetch live data grids and track targets.
                      </p>
                    </div>
                  ) : selectedSpreadsheetData ? (
                    <div className="flex flex-col gap-4">
                      
                      {/* Sheet Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 truncate">
                            {selectedSpreadsheetData.properties?.title || 'Google Sheet'}
                          </h4>
                          <span className="text-[9.5px] text-slate-500 font-mono truncate block">Spreadsheet ID: {selectedSpreadsheetId}</span>
                        </div>
                        {selectedSpreadsheetId && (
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-[10px] font-semibold border border-sky-500/20 transition-all"
                          >
                            <span>Open in Sheets</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>

                      {/* Tab Row for internal sheets */}
                      {selectedSpreadsheetData.sheets && selectedSpreadsheetData.sheets.length > 0 && (
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/5">
                          {selectedSpreadsheetData.sheets.map((sheetObj: any) => {
                            const name = sheetObj.properties.title;
                            return (
                              <button
                                key={name}
                                onClick={() => {
                                  setCurrentSheetName(name);
                                  setEditingCell(null);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition whitespace-nowrap ${
                                  currentSheetName === name
                                    ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                                }`}
                              >
                                📊 {name}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Interactive Cell Editing Overlay */}
                      {editingCell && (
                        <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9.5px] font-bold text-sky-400 block font-mono">Editing Cell {editingCell.label}</span>
                            <div className="flex gap-2 mt-1.5">
                              <input
                                type="text"
                                value={cellEditValue}
                                onChange={(e) => setCellEditValue(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs bg-black/55 border border-white/10 rounded-lg outline-none text-white focus:border-sky-500"
                                placeholder="Enter value..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellUpdate();
                                }}
                              />
                              <button
                                onClick={handleCellUpdate}
                                disabled={savingCell}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
                              >
                                {savingCell ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingCell(null)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Render Cell Values Grid Table */}
                      <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/20 max-h-[380px] scrollbar-thin">
                        <table className="w-full border-collapse text-left text-[11px] font-mono">
                          <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                              <th className="p-2 border-r border-white/5 bg-white/[0.01] text-slate-500 text-center w-10 font-bold">#</th>
                              {Array.from({ length: 8 }).map((_, colIdx) => {
                                const letter = String.fromCharCode(65 + colIdx); // A, B, C...
                                return (
                                  <th key={letter} className="p-2 border-r border-white/5 text-slate-400 font-bold text-center">
                                    {letter}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 12 }).map((_, rowIdx) => {
                              const rowNumber = rowIdx + 1;
                              
                              // Helper to find cell value from selectedSpreadsheetData gridData
                              const activeSheetData = selectedSpreadsheetData.sheets?.find(
                                (s: any) => s.properties.title === currentSheetName
                              );
                              const gridData = activeSheetData?.data?.[0];
                              const rowData = gridData?.rowData?.[rowIdx];

                              return (
                                <tr key={rowNumber} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                  <td className="p-1.5 border-r border-white/5 bg-white/[0.01] text-slate-500 text-center font-bold">
                                    {rowNumber}
                                  </td>
                                  {Array.from({ length: 8 }).map((_, colIdx) => {
                                    const colLetter = String.fromCharCode(65 + colIdx);
                                    const cellLabel = `${colLetter}${rowNumber}`;
                                    
                                    const cellObj = rowData?.values?.[colIdx];
                                    const displayValue = cellObj?.formattedValue || cellObj?.userEnteredValue?.stringValue || '';

                                    return (
                                      <td
                                        key={cellLabel}
                                        onClick={() => {
                                          setEditingCell({
                                            row: rowNumber,
                                            col: colIdx,
                                            label: cellLabel,
                                            currentVal: displayValue,
                                          });
                                          setCellEditValue(displayValue);
                                        }}
                                        className={`p-2 border-r border-white/5 text-slate-300 min-w-[90px] max-w-[120px] truncate cursor-pointer transition-colors ${
                                          editingCell?.label === cellLabel
                                            ? 'bg-sky-500/10 text-white border border-sky-400/50'
                                            : 'hover:bg-sky-500/5'
                                        }`}
                                        title={`Double click or tap to edit cell ${cellLabel}`}
                                      >
                                        {displayValue}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-400 mb-2" />
                      Loading spreadsheet structure...
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* Note Editing Overlay Modal */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-5 flex flex-col gap-4 text-left shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Edit3 size={13} /> Edit note details
                </h4>
                <button onClick={() => setEditingNote(null)} className="text-slate-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="Title"
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-semibold"
                />
                <textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  placeholder="Take a note..."
                  rows={4}
                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              {/* Edit bottom controls */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                <div className="flex items-center gap-1.5">
                  {Object.keys(colorMap).map((colorKey) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setEditingNote({ ...editingNote, color: colorKey })}
                      className={`w-4 h-4 rounded-full border transition ${
                        editingNote.color === colorKey 
                          ? 'border-white scale-125' 
                          : 'border-transparent hover:scale-110'
                      } ${
                        colorKey === 'slate' ? 'bg-slate-700' :
                        colorKey === 'indigo' ? 'bg-indigo-600' :
                        colorKey === 'blue' ? 'bg-blue-600' :
                        colorKey === 'emerald' ? 'bg-emerald-600' :
                        colorKey === 'amber' ? 'bg-amber-600' : 'bg-rose-600'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateNote(editingNote.id, {
                      title: editingNote.title,
                      content: editingNote.content,
                      color: editingNote.color,
                      isPinned: editingNote.isPinned,
                    })}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-xs text-white transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper renderer for Keep note cards
  function renderNoteCard(note: Note) {
    const colConfig = colorMap[note.color] || colorMap.slate;

    return (
      <motion.div
        layout
        key={note.id}
        className={`p-4 rounded-2xl border ${colConfig.bg} ${colConfig.border} hover:shadow-lg transition relative flex flex-col gap-2.5`}
      >
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-xs font-bold text-white leading-tight">{note.title || 'Untitled Note'}</h5>
          
          <div className="flex items-center gap-1 shrink-0 opacity-40 hover:opacity-100 transition">
            <button
              onClick={() => handleUpdateNote(note.id, { isPinned: !note.isPinned })}
              className={`p-1 rounded-md hover:bg-white/5 transition ${note.isPinned ? 'text-amber-400' : 'text-slate-400'}`}
              title={note.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin size={12} />
            </button>
            <button
              onClick={() => setEditingNote(note)}
              className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition"
              title="Edit Note"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={() => handleDeleteNote(note.id)}
              className="p-1 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
              title="Delete Note"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text font-sans">
          {note.content}
        </p>

        {note.updatedAt && (
          <div className="text-[9px] text-slate-500 font-mono self-end mt-1">
            Last synced: {new Date(note.updatedAt).toLocaleTimeString()}
          </div>
        )}
      </motion.div>
    );
  }
}

// Compact PlusCircleIcon replacement for visual clarity
function PlusCircleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
