import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  sendPhoneOtp,
  verifyPhoneOtp,
  requestPasswordReset,
} from '../../lib/supabase';
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
  RefreshCw,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'google' | 'email' | 'phone';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'email',
}) => {
  const { user } = useAuth();
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
      const { error } = await signInWithGoogle();
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
        const { data, error } = await signUpWithEmailPassword(email, password, fullName);
        if (error) throw error;
        setSuccessMessage('Registration successful! Check your email inbox to confirm your account.');
      } else {
        const { data, error } = await signInWithEmailPassword(email, password);
        if (error) throw error;
        setSuccessMessage('Welcome back! Signed in securely.');
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
    if (phoneNumber.length < 8) {
      setErrorMessage('Please enter a valid mobile number.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await sendPhoneOtp(fullPhone);
      if (error) throw error;
      setOtpSent(true);
      setSuccessMessage(`OTP security code transmitted to ${fullPhone}.`);
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
      const { data, error } = await verifyPhoneOtp(fullPhone, otpCode);
      if (error) throw error;
      setSuccessMessage('Phone identity verified! Logging in...');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">Security Access</span>
            <h3 className="font-serif text-xl font-bold text-white">
              {activeMethod === 'forgot'
                ? 'Reset Password'
                : isSignUp
                ? 'Create Guest Account'
                : 'Sign In to Nivora'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Method Tabs */}
        {activeMethod !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => { setActiveMethod('email'); setErrorMessage(null); }}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeMethod === 'email' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
            <button
              onClick={() => { setActiveMethod('phone'); setErrorMessage(null); }}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeMethod === 'phone' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile Phone OTP</span>
            </button>
          </div>
        )}

        {/* Google OAuth Quick Button */}
        {activeMethod !== 'forgot' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
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
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">or with credentials</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
          </div>
        )}

        {/* Method 1: Email & Password */}
        {activeMethod === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Victoria Hastings"
                    required={isSignUp}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-400">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setActiveMethod('forgot')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {isLoading ? 'Authenticating...' : isSignUp ? 'Register Account' : 'Sign In'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {isSignUp ? 'Already registered? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}

        {/* Method 2: Phone Number SMS OTP (India +91 and International) */}
        {activeMethod === 'phone' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mobile Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    An SMS verification passcode will be dispatched to this phone.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {isLoading ? 'Transmitting Code...' : 'Send OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-slate-400">Enter 6-digit Code</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP & Log In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Method 3: Forgot Password */}
        {activeMethod === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-400">
              Provide your account email address to receive an official recovery link.
            </p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {isLoading ? 'Transmitting...' : 'Send Recovery Link'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setActiveMethod('email')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
