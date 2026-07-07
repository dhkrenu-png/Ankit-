import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing app or initialize if not initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Calendar scope
provider.addScope('https://www.googleapis.com/auth/calendar');
// Request Tasks scopes
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/tasks.readonly');
// Request Gmail, Drive, and Sheets scopes
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory.
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // Log detailed authentication error to the server side (Express backend)
    try {
      await fetch('/api/auth/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: error.code || 'UNKNOWN_CODE',
          message: error.message || String(error),
          stack: error.stack || '',
          details: {
            userAgent: navigator.userAgent,
            origin: window.location.origin,
            href: window.location.href,
          }
        })
      });
    } catch (logErr) {
      console.error('Failed to log auth error to server:', logErr);
    }

    // Enhance the error object with a user-friendly custom message
    let friendlyMessage = 'An authentication error occurred. Please try again.';
    const code = error.code || '';
    
    if (code === 'auth/popup-blocked') {
      friendlyMessage = 'The Google authentication window was blocked. Please allow popups for this site, or open this application in a New Tab ↗ and try again.';
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'The sign-in window was closed before completing authentication. Please click Sign In with Google and complete the process.';
    } else if (code === 'auth/operation-not-allowed') {
      friendlyMessage = 'Google Sign-In is not enabled as an authentication provider in your Firebase project. Please enable it in the Firebase console.';
    } else if (code === 'auth/network-request-failed') {
      friendlyMessage = 'Network connection failed. Please check your internet connectivity and try again.';
    } else if (code === 'auth/unauthorized-domain') {
      friendlyMessage = 'This domain is not authorized for OAuth in the Firebase Console. Please add ' + window.location.hostname + ' to your OAuth redirect domains.';
    } else if (error.message?.includes('invalid_scope') || error.message?.includes('400') || error.code?.includes('invalid_scope')) {
      friendlyMessage = 'Invalid scope request. Keep scope has been removed. Please contact the developer if this persists.';
    }

    // Wrap the error with friendlyMessage so UI components can display it
    error.friendlyMessage = friendlyMessage;

    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
