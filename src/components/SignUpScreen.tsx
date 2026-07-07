import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  User, Mail, Lock, Shield, Check, X, AlertCircle, Loader2, Sparkles, 
  ArrowRight, Eye, EyeOff, Cpu, CheckCircle2, Circle, ArrowLeft
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../lib/googleAuth';

// Zod schema for registration validations
const signUpSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must contain at least one special character' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

// Light-weight custom resolver for Zod schema
const customZodResolver = (schema: z.ZodType<any, any, any>) => async (values: any) => {
  try {
    const data = schema.parse(values);
    return {
      values: data,
      errors: {},
    };
  } catch (err: any) {
    const errors: any = {};
    if (err instanceof z.ZodError) {
      err.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      });
    }
    return {
      values: {},
      errors,
    };
  }
};

interface SignUpScreenProps {
  key?: string;
  onSuccess: (userData: { email: string; fullName: string; username: string }) => void;
  onGoogleSignIn: () => Promise<any>;
}

export default function SignUpScreen({ onSuccess, onGoogleSignIn }: SignUpScreenProps) {
  // Screen views: 'welcome' | 'signin' | 'signup' | 'success'
  const [view, setView] = useState<'welcome' | 'signin' | 'signup' | 'success'>('welcome');
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Password reset state
  const [isForgotActive, setIsForgotActive] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Field toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Username check
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  // Interaction states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [glassNotification, setGlassNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Background Parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) / 60,
        y: (e.clientY - window.innerHeight / 2) / 60,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // React Hook Form for signup
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isValid }
  } = useForm<SignUpFormData>({
    mode: 'onChange',
    resolver: customZodResolver(signUpSchema),
  });

  const passwordVal = watch('password') || '';
  const usernameVal = watch('username') || '';

  // Live Password checklist validation
  const checklist = {
    length: passwordVal.length >= 8,
    upper: /[A-Z]/.test(passwordVal),
    lower: /[a-z]/.test(passwordVal),
    number: /[0-9]/.test(passwordVal),
    special: /[^A-Za-z0-9]/.test(passwordVal),
  };

  const metCount = Object.values(checklist).filter(Boolean).length;
  const strengthText = 
    metCount === 0 ? 'Empty' :
    metCount <= 2 ? 'Weak' :
    metCount <= 3 ? 'Fair' :
    metCount <= 4 ? 'Good' : 'Strong';

  const strengthColor = 
    strengthText === 'Weak' ? 'bg-rose-500' :
    strengthText === 'Fair' ? 'bg-amber-500' :
    strengthText === 'Good' ? 'bg-sky-500' : 'bg-emerald-500';

  // Live Username availability check
  useEffect(() => {
    if (usernameVal.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    const delayDebounce = setTimeout(() => {
      const takenUsernames = ['admin', 'zenith', 'ankit', 'root', 'savage', 'guardian'];
      const isTaken = takenUsernames.includes(usernameVal.toLowerCase());
      setUsernameAvailable(!isTaken);
      setUsernameChecking(false);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [usernameVal]);

  // Auth Error Handler
  const handleAuthError = (err: any) => {
    const code = err?.code || '';
    let message = err?.friendlyMessage || err?.message || 'Authentication error occurred.';
    
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      message = 'Invalid email or password credentials.';
    } else if (code === 'auth/email-already-in-use') {
      message = 'This email address is already registered with Zenith.';
    } else if (code === 'auth/weak-password') {
      message = 'Password does not meet the necessary neural complexity.';
    } else if (code === 'auth/invalid-email') {
      message = 'Please provide a valid email address.';
    } else if (code === 'auth/popup-closed-by-user') {
      message = err?.friendlyMessage || 'Google authorization popup closed. Click "Open in a New Tab ↗" at top-right to authorize seamlessly.';
    }
    
    setGlassNotification({ message, type: 'error' });
  };

  // Sign In submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlassNotification(null);
    setIsSubmitting(true);
    try {
      const res = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      if (res.user) {
        setView('success');
        const user = res.user;
        const derivedUsername = (user.displayName || user.email?.split('@')[0] || 'zenith_member').toLowerCase().replace(/\s+/g, '_');
        const userData = {
          email: user.email || '',
          fullName: user.displayName || 'Zenith OS Member',
          username: derivedUsername
        };
        localStorage.setItem('zenith_user', JSON.stringify(userData));
        localStorage.setItem('zenith_registered', 'true');
        setTimeout(() => {
          onSuccess(userData);
        }, 2200);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up submit
  const onRegisterSubmit = async (data: SignUpFormData) => {
    setGlassNotification(null);
    setIsSubmitting(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (res.user) {
        await updateProfile(res.user, { displayName: data.fullName });
        setView('success');
        const userData = {
          email: data.email,
          fullName: data.fullName,
          username: data.username
        };
        localStorage.setItem('zenith_user', JSON.stringify(userData));
        localStorage.setItem('zenith_registered', 'true');
        setTimeout(() => {
          onSuccess(userData);
        }, 2200);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth flow
  const handleOAuthGoogle = async () => {
    setGlassNotification(null);
    setIsSubmitting(true);
    try {
      const res = await onGoogleSignIn();
      if (res) {
        setView('success');
        const user = res.user;
        const derivedUsername = (user.displayName || user.email?.split('@')[0] || 'GoogleUser').toLowerCase().replace(/\s+/g, '_');
        const userData = {
          email: user.email || '',
          fullName: user.displayName || 'Google Member',
          username: derivedUsername
        };
        localStorage.setItem('zenith_user', JSON.stringify(userData));
        localStorage.setItem('zenith_registered', 'true');
        setTimeout(() => {
          onSuccess(userData);
        }, 2200);
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password reset handler
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setGlassNotification(null);
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setGlassNotification({
        message: 'A secure memory recovery key has been dispatched to your email trace.',
        type: 'success'
      });
      setIsForgotActive(false);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsSendingReset(false);
    }
  };

  // Space particles generator
  const starParticles = Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 4,
    size: Math.random() * 2 + 0.8,
    duration: Math.random() * 5 + 4
  }));

  return (
    <div className="fixed inset-0 bg-black text-slate-100 flex items-center justify-center overflow-hidden z-[9999] font-sans">
      
      {/* Deep Space Atmospheric layers */}
      <div 
        className="absolute inset-0 pointer-events-none transition-transform duration-300 ease-out bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06)_0%,transparent_70%)]"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
        }}
      />
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.04)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.04)_0%,transparent_50%)] pointer-events-none" />

      {/* Cinematic Glowing Lights */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Dynamic Star Field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {starParticles.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white/30"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0.1, 0.7, 0.1],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ================= WELCOME SCREEN ================= */}
        {view === 'welcome' && (
          <motion.div
            key="welcome_panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-4 z-10"
          >
            {/* Glassmorphic Container */}
            <div className="bg-[#050505]/50 border border-white/10 rounded-[24px] backdrop-blur-[32px] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.85)] relative overflow-hidden text-center">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              
              {/* Spinning Quantum Concentric Rings */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center mb-6">
                <motion.div
                  className="absolute inset-0 border border-indigo-500/25 rounded-full"
                  animate={{ scale: [1, 1.12, 1], rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute -inset-3 border border-cyan-500/10 border-dashed rounded-full"
                  animate={{ scale: [1, 0.96, 1], rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
                <div className="w-16 h-16 rounded-full bg-black border border-indigo-500/30 flex items-center justify-center relative shadow-[0_0_40px_rgba(99,102,241,0.25)]">
                  <Cpu className="w-6.5 h-6.5 text-indigo-400" />
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-3xl font-black tracking-widest text-white uppercase mb-1">
                ZENITH
              </h1>
              <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400 uppercase font-bold mb-4">
                The Cognitive OS
              </div>
              
              <p className="text-sm text-slate-300 font-sans px-4 mb-8 leading-relaxed font-light">
                Sign in or create your account to continue into your personalized digital workspace.
              </p>

              {/* Glass Notification */}
              {glassNotification && (
                <div className="mb-5 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 text-[11px] leading-relaxed">{glassNotification.message}</span>
                </div>
              )}

              {/* Action CTAs */}
              <div className="space-y-3.5">
                <button
                  id="btn_welcome_signin"
                  onClick={() => { setView('signin'); setGlassNotification(null); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-sans text-xs tracking-wider uppercase font-bold active:scale-[0.98] transition-all duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="btn_welcome_signup"
                  onClick={() => { setView('signup'); setGlassNotification(null); }}
                  className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-white font-sans text-xs tracking-wider uppercase font-bold active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Create Account
                </button>
              </div>

              {/* Social Login Separator */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-x-0 h-[1px] bg-white/5" />
                <span className="relative z-10 px-3 bg-black text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Or continue with
                </span>
              </div>

              {/* SSO Buttons Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Google Sign-In */}
                <button
                  id="btn_sso_google"
                  onClick={handleOAuthGoogle}
                  className="flex items-center justify-center gap-2 bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] text-[11px] text-white rounded-xl py-2.5 font-bold transition active:scale-[0.97] cursor-pointer"
                  title="Sign in with Google"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google</span>
                </button>

                {/* GitHub Sign-In Mock */}
                <button
                  id="btn_sso_github"
                  onClick={() => setGlassNotification({ message: 'GitHub login option selected. This provider is current calibrating. Choose Google or Email in the meantime!', type: 'info' })}
                  className="flex items-center justify-center gap-2 bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] text-[11px] text-white rounded-xl py-2.5 font-bold transition active:scale-[0.97] cursor-pointer"
                  title="Sign in with GitHub"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </button>

                {/* Apple Sign-In Mock */}
                <button
                  id="btn_sso_apple"
                  onClick={() => setGlassNotification({ message: 'Apple credentials can be sync\'d by selecting Continue with Google in the meantime.', type: 'info' })}
                  className="flex items-center justify-center gap-2 bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] text-[11px] text-white rounded-xl py-2.5 font-bold transition active:scale-[0.97] cursor-pointer"
                  title="Sign in with Apple"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-1.02 0-1.4-.61-2.54-.61-1.16 0-1.55.61-2.54.61-1.01 0-2.2-.99-3.2-1.92-2.06-2.06-3.64-5.85-3.64-9.39 0-5.61 3.65-8.59 7.11-8.59 1.1 0 2.11.66 2.78.66.68 0 1.9-.81 3.28-.81 1.44 0 2.74.52 3.56 1.47-2.92 1.77-2.45 5.69.49 6.88-1.28 3.09-3.73 8.35-5.96 11.3zm-3.12-19.14c1.17-1.42 1.05-3.14.93-3.14-1.37.11-2.93.99-3.66 1.84-1.15 1.35-1.01 3.08-.91 3.08.13.01.13.01.16.01 1.34 0 2.72-.94 3.48-1.79z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Privacy Footer */}
              <div className="mt-7 pt-4 border-t border-white/5 flex justify-center gap-3 text-[9px] text-slate-600 font-mono">
                <a href="#privacy" onClick={(e) => { e.preventDefault(); setGlassNotification({ message: 'Zenith OS protects your data with military-grade zero-knowledge client encryption.', type: 'info' }); }} className="hover:text-slate-400 transition">Privacy Policy</a>
                <span>•</span>
                <a href="#terms" onClick={(e) => { e.preventDefault(); setGlassNotification({ message: 'By loading Zenith, you authorize neural synchronization of focus targets.', type: 'info' }); }} className="hover:text-slate-400 transition">Terms of Service</a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= SIGN IN VIEW ================= */}
        {view === 'signin' && (
          <motion.div
            key="signin_panel"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.97 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-4 z-10"
          >
            <div className="bg-[#050505]/50 border border-white/10 rounded-[24px] backdrop-blur-[32px] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.85)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              
              {/* Back button */}
              <button
                id="btn_signin_back"
                onClick={() => { setView('welcome'); setGlassNotification(null); setIsForgotActive(false); }}
                className="absolute left-6 top-6 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono group cursor-pointer"
              >
                <ArrowLeft size={14} className="group-hover:translate-x-[-2px] transition-transform" />
                <span>Back</span>
              </button>

              <div className="text-center mb-8 mt-4">
                <div className="flex justify-center items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-3 text-white" />
                  </div>
                  <span className="text-[10px] font-mono tracking-[0.3em] text-indigo-400 uppercase font-black">Zenith OS</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-wide uppercase">
                  {isForgotActive ? 'Reset Token' : 'Sign In'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isForgotActive ? 'Recover your security credentials.' : 'Re-establish your neural workspace connection.'}
                </p>
              </div>

              {/* Notifications */}
              {glassNotification && (
                <div className={`mb-5 p-3 rounded-xl border flex items-start gap-2.5 ${
                  glassNotification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 text-[11px] leading-relaxed text-left">{glassNotification.message}</span>
                </div>
              )}

              {isForgotActive ? (
                /* PASSWORD RESET FLOW */
                <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                    <input 
                      id="input_reset_email"
                      type="email" 
                      placeholder="Enter Registered Email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>

                  <button
                    id="btn_submit_reset_email"
                    type="submit"
                    disabled={isSendingReset}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all duration-200 mt-2 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Recovery Key...</span>
                      </>
                    ) : (
                      <span>Request Reset Link</span>
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      id="btn_forgot_cancel"
                      type="button"
                      onClick={() => setIsForgotActive(false)}
                      className="text-[10px] font-mono text-slate-400 hover:text-white transition underline cursor-pointer"
                    >
                      Cancel and return to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* MAIN LOGIN FORM */
                <form onSubmit={handleSignInSubmit} className="space-y-4 text-left">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                    <input 
                      id="input_signin_email"
                      type="email" 
                      placeholder="Email Address" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                    <input 
                      id="input_signin_password"
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Security Password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 pl-11 pr-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    />
                    <button
                      id="btn_signin_toggle_password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Options row: Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        id="chk_remember_me"
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span>Remember Me</span>
                    </label>
                    <button 
                      id="btn_forgot_trigger"
                      type="button"
                      onClick={() => { setIsForgotActive(true); setGlassNotification(null); }}
                      className="hover:text-indigo-400 transition underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    id="btn_signin_submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all duration-200 mt-3 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Synchronizing Neural Core...</span>
                      </>
                    ) : (
                      <span>Authenticate and Connect</span>
                    )}
                  </button>
                </form>
              )}

              {/* Switch View Link */}
              <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <button 
                  id="btn_toggle_welcome_view"
                  type="button" 
                  onClick={() => { setView('signup'); setGlassNotification(null); }} 
                  className="text-[10.5px] font-mono text-slate-500 hover:text-indigo-400 transition underline cursor-pointer"
                >
                  Don't have an account? Create Account
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= SIGN UP VIEW ================= */}
        {view === 'signup' && (
          <motion.div
            key="signup_panel"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.97 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg mx-4 z-10 max-h-[95vh] overflow-y-auto scrollbar-none"
          >
            <div className="bg-[#050505]/50 border border-white/10 rounded-[24px] backdrop-blur-[32px] p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.85)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              
              {/* Back button */}
              <button
                id="btn_signup_back"
                onClick={() => { setView('welcome'); setGlassNotification(null); }}
                className="absolute left-6 top-6 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono group cursor-pointer"
              >
                <ArrowLeft size={14} className="group-hover:translate-x-[-2px] transition-transform" />
                <span>Back</span>
              </button>

              <div className="text-center mb-6 mt-4">
                <div className="flex justify-center items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-3 text-white" />
                  </div>
                  <span className="text-[10px] font-mono tracking-[0.3em] text-indigo-400 uppercase font-black">Zenith OS</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-wide uppercase">
                  Create Account
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Begin your cognitive productivity journey.
                </p>
              </div>

              {/* Notifications */}
              {glassNotification && (
                <div className="mb-5 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs text-left flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 text-[11px] leading-relaxed">{glassNotification.message}</span>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4 text-left">
                
                {/* Full Name */}
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                  <input
                    id="input_signup_fullname"
                    {...register('fullName')}
                    type="text"
                    placeholder="Full Name"
                    className={`w-full bg-white/[0.02] border ${errors.fullName ? 'border-rose-500/40 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'} rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none focus:ring-1 transition-all duration-300`}
                  />
                  {errors.fullName && (
                    <span className="text-[10px] text-rose-400 mt-1 block pl-2 font-mono">{errors.fullName.message}</span>
                  )}
                </div>

                {/* Username */}
                <div className="relative group">
                  <Shield className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                  <input
                    id="input_signup_username"
                    {...register('username')}
                    type="text"
                    placeholder="Username"
                    className={`w-full bg-white/[0.02] border ${errors.username ? 'border-rose-500/40 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'} rounded-xl py-3 pl-11 pr-10 text-xs text-white focus:outline-none focus:ring-1 transition-all duration-300`}
                  />
                  
                  {/* Checker feedback */}
                  <div className="absolute right-3.5 top-3 flex items-center">
                    {usernameChecking && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                    {!usernameChecking && usernameAvailable === true && <Check className="w-4 h-4 text-emerald-400" />}
                    {!usernameChecking && usernameAvailable === false && <X className="w-4 h-4 text-rose-400" />}
                  </div>

                  {errors.username && (
                    <span className="text-[10px] text-rose-400 mt-1 block pl-2 font-mono">{errors.username.message}</span>
                  )}
                  {!errors.username && usernameAvailable === true && (
                    <span className="text-[9px] text-emerald-400 mt-1 block pl-2 font-mono">✓ Username is available</span>
                  )}
                  {!errors.username && usernameAvailable === false && (
                    <span className="text-[9px] text-rose-400 mt-1 block pl-2 font-mono">✗ Username is taken</span>
                  )}
                </div>

                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                  <input
                    id="input_signup_email"
                    {...register('email')}
                    type="email"
                    placeholder="Email Address"
                    className={`w-full bg-white/[0.02] border ${errors.email ? 'border-rose-500/40 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'} rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none focus:ring-1 transition-all duration-300`}
                  />
                  {errors.email && (
                    <span className="text-[10px] text-rose-400 mt-1 block pl-2 font-mono">{errors.email.message}</span>
                  )}
                </div>

                {/* Password & Confirm row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                      <input
                        id="input_signup_password"
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        className={`w-full bg-white/[0.02] border ${errors.password ? 'border-rose-500/40 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'} rounded-xl py-3 pl-11 pr-10 text-xs text-white focus:outline-none focus:ring-1 transition-all duration-300`}
                      />
                      <button
                        id="btn_signup_toggle_pwd"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="text-[9.5px] text-rose-400 block pl-1 font-mono leading-tight">{errors.password.message}</span>
                    )}

                    {/* Strength Progress Meter */}
                    {passwordVal && (
                      <div className="pt-1 px-1">
                        <div className="flex justify-between items-center mb-1 text-[9px] font-mono">
                          <span className="text-slate-400">Strength:</span>
                          <span className={`font-bold ${
                            strengthText === 'Weak' ? 'text-rose-400' :
                            strengthText === 'Fair' ? 'text-amber-400' :
                            strengthText === 'Good' ? 'text-sky-400' : 'text-emerald-400'
                          }`}>{strengthText}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                          <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${(metCount / 5) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="relative group self-start">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition" />
                    <input
                      id="input_signup_confirmpassword"
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      className={`w-full bg-white/[0.02] border ${errors.confirmPassword ? 'border-rose-500/40 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'} rounded-xl py-3 pl-11 pr-10 text-xs text-white focus:outline-none focus:ring-1 transition-all duration-300`}
                    />
                    <button
                      id="btn_signup_toggle_confirmpwd"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    {errors.confirmPassword && (
                      <span className="text-[10px] text-rose-400 mt-1 block pl-2 font-mono">{errors.confirmPassword.message}</span>
                    )}
                  </div>
                </div>

                {/* Password Live Checklist */}
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {checklist.length ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-600" />}
                    <span className={checklist.length ? 'text-slate-300' : ''}>8+ Characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checklist.upper ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-600" />}
                    <span className={checklist.upper ? 'text-slate-300' : ''}>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checklist.lower ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-600" />}
                    <span className={checklist.lower ? 'text-slate-300' : ''}>Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checklist.number ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-600" />}
                    <span className={checklist.number ? 'text-slate-300' : ''}>Numeric digit</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    {checklist.special ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-600" />}
                    <span className={checklist.special ? 'text-slate-300' : ''}>Special symbol (!@#$%^&*)</span>
                  </div>
                </div>

                {/* Terms and conditions */}
                <label className="flex items-start gap-2 text-[10px] font-mono text-slate-400 select-none pl-1 cursor-pointer pt-1 leading-snug">
                  <input 
                    id="chk_terms"
                    type="checkbox" 
                    required 
                    className="mt-0.5 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>I synchronize with the Terms of Service & Privacy protocols.</span>
                </label>

                {/* Create Account button */}
                <button
                  id="btn_signup_submit"
                  type="submit"
                  disabled={!isValid || usernameAvailable === false || isSubmitting}
                  className={`w-full relative overflow-hidden text-xs font-bold uppercase tracking-widest rounded-xl py-3.5 transition-all duration-300 ${
                    isValid && usernameAvailable !== false && !isSubmitting
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:shadow-indigo-500/25 shadow-lg shadow-indigo-600/10 text-white cursor-pointer active:scale-[0.98]'
                      : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Calibrating Zenith Environment...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Switch View Link */}
              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <button 
                  id="btn_toggle_signin_view"
                  type="button" 
                  onClick={() => { setView('signin'); setGlassNotification(null); }} 
                  className="text-[10.5px] font-mono text-slate-500 hover:text-indigo-400 transition underline cursor-pointer"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= SUCCESS REDIRECT ================= */}
        {view === 'success' && (
          <motion.div
            key="success_panel"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="text-center space-y-6 z-10"
          >
            {/* Glowing Shield Halo */}
            <div className="flex justify-center">
              <motion.div
                className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.35)]"
                initial={{ rotate: -90, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 10 }}
              >
                <Check className="w-12 h-12 text-emerald-400" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-widest text-emerald-400 uppercase">
                Access Calibrated
              </h1>
              <p className="text-sm font-mono text-slate-300 tracking-[0.15em] uppercase">
                Welcome to ZENITH OS
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 border border-white/5 rounded-full text-[10px] font-mono text-indigo-300 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Configuring Cognitive Interface Workspace...</span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
