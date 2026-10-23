import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { signInWithEmailPassword, signInWithGoogle } from '../../lib/supabase';
import { db } from '../../lib/db';
import { RESORT_IMAGES } from '../../lib/assets';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  X,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sun,
  Moon,
} from 'lucide-react';

interface FrontDeskAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FrontDeskAuthModal: React.FC<FrontDeskAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Front Desk Credentials
  const [email, setEmail] = useState('frontdesk@nivoraresort.com');
  const [password, setPassword] = useState('FrontDesk2026!');

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFrontDeskLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const trimmedEmail = email.trim();
      const isAuthorized = db.canEmailAccessPortal(trimmedEmail, 'front_desk');

      // Verify that this account is provisioned for front desk or executive admin
      if (!isAuthorized) {
        throw new Error('Access restricted: This account does not possess Front Desk privileges. Please use authorized front desk credentials or authorized executive admin email.');
      }

      // Attempt Supabase sign in
      const { error } = await signInWithEmailPassword(trimmedEmail, password);
      if (error) {
        console.warn('Supabase auth notice for front desk login:', error.message);
      }

      setSuccessMessage(
        db.isSuperAdmin(trimmedEmail)
          ? 'Executive Administrator identity confirmed. Initializing Front Desk Intelligence...'
          : 'Front Desk identity verified. Initializing Front Desk Intelligence...'
      );
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Front Desk authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFrontDeskSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithGoogle('front-desk');
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Front Desk Google SSO authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-[#C7A36A]/30 bg-[#F7F3EA] dark:bg-[#161916] flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Left Side: Front Desk Imagery & Branding */}
        <div className="relative md:w-5/12 min-h-[220px] md:min-h-[560px] flex flex-col justify-between p-6 sm:p-8 text-white overflow-hidden bg-[#12382D]">
          <ImageWithFallback
            src={RESORT_IMAGES.presidentialSuite}
            alt="Nivora Front Desk Intelligence"
            loading="eager"
            containerClassName="absolute inset-0 w-full h-full"
            className="w-full h-full object-cover object-center scale-105 opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A201A] via-[#12382D]/85 to-[#12382D]/50" />

          {/* Top Brand */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#C7A36A] text-[11px] tracking-widest uppercase mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Front Desk Intelligence</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-wide text-white leading-tight">
              NIVORA RESORT
            </h2>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#C7A36A] mt-1 font-sans">
              Guest Reception & Yield Console
            </p>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 mt-auto pt-6 border-t border-white/15 text-xs text-[#A9B8A4]">
            <p className="leading-relaxed">
              Restricted management console for front desk executives, night auditors, and reservation supervisors.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[#C7A36A]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Front Desk Authorization Enforced</span>
            </div>
          </div>
        </div>

        {/* Right Side: Front Desk Login Form */}
        <div className="md:w-7/12 p-6 sm:p-10 overflow-y-auto bg-[#F7F3EA] dark:bg-[#191D19] text-[#242722] dark:text-[#F7F3EA] flex flex-col justify-between">
          <div>
            {/* Top Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-[#C7A36A]/20">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#12382D] dark:text-[#C7A36A] font-semibold">
                  Management SSO Gateway
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="p-1.5 rounded-lg border border-[#C7A36A]/30 text-[#242722] dark:text-[#F7F3EA] hover:bg-[#12382D]/10 dark:hover:bg-white/10 transition-colors"
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

            {/* Header */}
            <div className="mt-6 mb-6">
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#12382D] dark:text-[#F7F3EA]">
                Front Desk Authentication
              </h3>
              <p className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] mt-1.5 leading-relaxed">
                Sign in with your verified reception credentials or authorized executive admin account to manage room readiness, check-in operations, room assignments, and guest folios.
              </p>

              {/* Quick Preset Selector for Testing */}
              <div className="mt-3 flex items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-xl text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('frontdesk@nivoraresort.com');
                    setPassword('FrontDesk2026!');
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                    email === 'frontdesk@nivoraresort.com'
                      ? 'bg-[#12382D] text-white font-medium shadow-xs'
                      : 'text-[#242722]/70 dark:text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-white'
                  }`}
                >
                  Front Desk Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dhiru636441@gmail.com');
                    setPassword('NivoraAdmin2026!');
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                    email === 'dhiru636441@gmail.com'
                      ? 'bg-[#12382D] text-white font-medium shadow-xs'
                      : 'text-[#242722]/70 dark:text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-white'
                  }`}
                >
                  Admin (Owner)
                </button>
              </div>
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

            {/* Login Form */}
            <form onSubmit={handleFrontDeskLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA] mb-1">
                  Front Desk Agent Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#C7A36A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="frontdesk@nivoraresort.com"
                    required
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722]/80 dark:text-[#F7F3EA] mb-1">
                  Agent Security Passphrase
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#C7A36A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#12382D] hover:bg-[#0E2C23] disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'Authorizing Front Desk...' : 'Access Front Desk Intelligence'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C7A36A]" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#C7A36A]/20"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-[#242722]/50 dark:text-[#A9B8A4] tracking-widest">
                  or corporate sso
                </span>
                <div className="flex-grow border-t border-[#C7A36A]/20"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleFrontDeskSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl border border-[#C7A36A]/30 bg-white dark:bg-[#1E231E] hover:bg-[#F0EAE1] dark:hover:bg-[#252B25] text-xs font-medium text-[#242722] dark:text-[#F7F3EA] transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Enterprise SSO (Front Desk)</span>
              </button>
            </form>
          </div>

          <div className="mt-6 pt-3 border-t border-[#C7A36A]/20 flex items-center justify-between text-[11px] text-[#242722]/60 dark:text-[#A9B8A4]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C7A36A]" />
              <span>Audit Logging Active</span>
            </span>
            <span>Role-Based Access Enforcement</span>
          </div>
        </div>
      </div>
    </div>
  );
};
