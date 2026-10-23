import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  sendPhoneOtp,
  verifyPhoneOtp,
  requestPasswordReset,
} from '../../lib/supabase';
import { UserRole } from '../../lib/types';
import { RESORT_IMAGES } from '../../lib/assets';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  X,
  Mail,
  Lock,
  Phone,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  KeyRound,
  Compass,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'google' | 'email' | 'phone';
  targetPortal?: string;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'email',
  targetPortal,
  initialRole = 'customer',
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeMethod, setActiveMethod] = useState<'email' | 'phone' | 'forgot'>(
    defaultTab === 'phone' ? 'phone' : 'email'
  );
  const [isSignUp, setIsSignUp] = useState(false);

  // Email form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Phone OTP form
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithGoogle('customer');
      if (error) {
        setErrorMessage(error.message || 'Google authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setErrorMessage('Please provide your full legal name.');
          setIsLoading(false);
          return;
        }
        const { data: signUpData, error } = await signUpWithEmailPassword(email, password, fullName);
        if (error) throw error;

        if (signUpData?.session) {
          setSuccessMessage(`Welcome to Nivora, ${fullName}. Signing into your sanctuary...`);
          setTimeout(() => onClose(), 1200);
        } else {
          // Attempt sign in to establish real session immediately
          const loginRes = await signInWithEmailPassword(email, password);
          if (!loginRes.error && loginRes.data?.session) {
            setSuccessMessage(`Welcome to Nivora, ${fullName}. Signing into your sanctuary...`);
            setTimeout(() => onClose(), 1200);
          } else {
            setSuccessMessage('Registration submitted successfully! If email verification is required, please check your inbox to confirm your account.');
          }
        }
      } else {
        const { error } = await signInWithEmailPassword(email, password);
        if (error) throw error;
        setSuccessMessage('Welcome to Nivora. Signing into your sanctuary...');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    if (phoneNumber.length < 7) {
      setErrorMessage('Please enter a valid mobile number.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await sendPhoneOtp(fullPhone);
      if (error) throw error;
      setOtpSent(true);
      setSuccessMessage(`One-time security passcode dispatched to ${fullPhone}.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to deliver SMS OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

    try {
      const { error } = await verifyPhoneOtp(fullPhone, otpCode);
      if (error) throw error;
      setSuccessMessage('Passcode verified! Accessing resort portal...');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await requestPasswordReset(email);
      if (error) throw error;
      setSuccessMessage('Password recovery instructions dispatched to your email address.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset email.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-[#C7A36A]/20 bg-[#F7F3EA] dark:bg-[#161916] flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Left Side: Authentic Luxury Resort Photograph */}
        <div className="relative md:w-1/2 min-h-[260px] md:min-h-[640px] flex flex-col justify-between p-6 sm:p-10 text-white overflow-hidden">
          {/* Background image */}
          <ImageWithFallback
            src={RESORT_IMAGES.hero}
            alt="Nivora Luxury Resort & Residences"
            loading="eager"
            containerClassName="absolute inset-0 w-full h-full"
            className="w-full h-full object-cover object-center scale-105"
          />
          {/* Deep Forest Green gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12382D] via-[#12382D]/75 to-[#12382D]/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/25" />

          {/* Top Branding */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F7F3EA] text-[11px] tracking-widest uppercase mb-4">
              <Sparkles className="w-3 h-3 text-[#C7A36A]" />
              <span>Sovereign Peninsula · Est. 1998</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-wide text-white leading-tight">
              N I V O R A
            </h2>
            <p className="text-xs uppercase tracking-[0.25em] text-[#C7A36A] mt-1 font-sans">
              Resort & Residences
            </p>
          </div>

          {/* Bottom Editorial Quote */}
          <div className="relative z-10 mt-auto pt-8">
            <p className="font-serif italic text-lg sm:text-xl text-[#F7F3EA]/95 leading-relaxed max-w-md">
              “An oasis of timeless serenity and bespoke hospitality. Curated sanctuaries, intuitive intelligence, uncompromised comfort.”
            </p>
            <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-[#A9B8A4]">
              <span>Forbes Five-Star Collection</span>
              <span className="text-[#C7A36A]">✦ ✦ ✦ ✦ ✦</span>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Warm Ivory Card */}
        <div className="md:w-1/2 p-6 sm:p-10 overflow-y-auto bg-[#F7F3EA] dark:bg-[#191D19] text-[#242722] dark:text-[#F7F3EA] flex flex-col justify-between">
          <div>
            {/* Top Controls: Theme toggle & Close */}
            <div className="flex items-center justify-between pb-4 border-b border-[#C7A36A]/20">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-sans uppercase tracking-widest text-[#12382D] dark:text-[#C7A36A] font-semibold">
                  Secure Access
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="p-1.5 rounded-lg border border-[#C7A36A]/30 text-[#242722] dark:text-[#F7F3EA] hover:bg-[#12382D]/10 dark:hover:bg-white/10 transition-colors"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-[#C7A36A]" /> : <Moon className="w-4 h-4 text-[#12382D]" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg border border-[#C7A36A]/30 text-[#242722] dark:text-[#F7F3EA] hover:bg-[#12382D]/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="mt-5 mb-4">
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#12382D] dark:text-[#F7F3EA]">
                {activeMethod === 'forgot'
                  ? 'Reset Your Password'
                  : isSignUp
                  ? 'Create Guest Profile'
                  : 'Welcome to Nivora'}
              </h3>
              <p className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] mt-1">
                {activeMethod === 'forgot'
                  ? 'Enter your email address to receive secure recovery access.'
                  : isSignUp
                  ? 'Register for bespoke luxury reservations and personalised concierge services.'
                  : 'Sign in to access your sanctuary reservations, room dining, and luxury experiences.'}
              </p>
            </div>

            {/* Error & Success Feedback */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            {activeMethod !== 'forgot' && (
              <div className="space-y-3 mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#C7A36A]/40 bg-white dark:bg-[#1E231E] hover:bg-[#F0EAE1] dark:hover:bg-[#252B25] text-xs font-medium text-[#242722] dark:text-[#F7F3EA] shadow-xs transition-all cursor-pointer hover:border-[#C7A36A]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#C7A36A]/20"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-[#242722]/50 dark:text-[#A9B8A4] tracking-widest">
                    or authenticate with credentials
                  </span>
                  <div className="flex-grow border-t border-[#C7A36A]/20"></div>
                </div>
              </div>
            )}

            {/* Auth Method Subtabs: Email vs Mobile OTP */}
            {activeMethod !== 'forgot' && (
              <div className="flex gap-2 mb-4 border-b border-[#C7A36A]/20 pb-2">
                <button
                  type="button"
                  onClick={() => { setActiveMethod('email'); setErrorMessage(null); }}
                  className={`text-xs font-medium pb-1.5 transition-colors ${
                    activeMethod === 'email'
                      ? 'border-b-2 border-[#12382D] dark:border-[#C7A36A] text-[#12382D] dark:text-[#C7A36A] font-semibold'
                      : 'text-[#242722]/60 dark:text-[#A9B8A4] hover:text-[#12382D]'
                  }`}
                >
                  Email & Password
                </button>
                <span className="text-[#C7A36A]/40">·</span>
                <button
                  type="button"
                  onClick={() => { setActiveMethod('phone'); setErrorMessage(null); }}
                  className={`text-xs font-medium pb-1.5 transition-colors ${
                    activeMethod === 'phone'
                      ? 'border-b-2 border-[#12382D] dark:border-[#C7A36A] text-[#12382D] dark:text-[#C7A36A] font-semibold'
                      : 'text-[#242722]/60 dark:text-[#A9B8A4] hover:text-[#12382D]'
                  }`}
                >
                  Phone SMS OTP
                </button>
              </div>
            )}

            {/* Email Form */}
            {activeMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA] mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#C7A36A] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Lady Victoria Laurent"
                        required={isSignUp}
                        className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#C7A36A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA]">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setActiveMethod('forgot')}
                        className="text-[11px] text-[#C7A36A] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#C7A36A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#12382D] hover:bg-[#0E2C23] disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isLoading ? 'Verifying...' : isSignUp ? 'Register Sanctuary Account' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C7A36A]" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-[#F7F3EA]"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "New guest? Create an account"}
                  </button>
                </div>
              </form>
            )}

            {/* Mobile Phone OTP */}
            {activeMethod === 'phone' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA] mb-1">
                        Mobile Phone Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-2.5 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                        >
                          <option value="+91">🇮🇳 India (+91)</option>
                          <option value="+1">🇺🇸 US / CA (+1)</option>
                          <option value="+44">🇬🇧 UK (+44)</option>
                          <option value="+971">🇦🇪 UAE (+971)</option>
                          <option value="+65">🇸🇬 Singapore (+65)</option>
                          <option value="+61">🇦🇺 Australia (+61)</option>
                        </select>

                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="98765 43210"
                          required
                          className="flex-1 bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs font-mono text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                        />
                      </div>
                      <p className="text-[11px] text-[#242722]/60 dark:text-[#A9B8A4] mt-1.5">
                        A secure 6-digit verification code will be dispatched to this mobile device.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-[#12382D] hover:bg-[#0E2C23] disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      {isLoading ? 'Transmitting code...' : 'Dispatch Passcode'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA]">
                          Enter 6-Digit Passcode
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] text-[#C7A36A] hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        required
                        maxLength={8}
                        className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-[#12382D] dark:text-[#C7A36A] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-[#12382D] hover:bg-[#0E2C23] disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Enter'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Forgot Password */}
            {activeMethod === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA] mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#12382D] hover:bg-[#0E2C23] disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {isLoading ? 'Transmitting instructions...' : 'Send Recovery Link'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveMethod('email')}
                    className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] hover:text-[#12382D]"
                  >
                    Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Demo Helper Hint */}
          <div className="mt-6 pt-3 border-t border-[#C7A36A]/20 flex items-center justify-between text-[11px] text-[#242722]/60 dark:text-[#A9B8A4]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C7A36A]" />
              <span>TLS 256-bit encryption</span>
            </span>
            <span>Role-Based Access Control</span>
          </div>
        </div>

      </div>
    </div>
  );
};
