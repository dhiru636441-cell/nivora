import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

interface AuthCallbackProps {
  onSuccess: (targetPortal?: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleAuthRedirect() {
      try {
        if (!supabase) {
          if (mounted) onSuccess();
          return;
        }

        // 1. Check for OAuth error in URL hash or search parameters
        const hashStr = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashStr);
        const queryParams = new URLSearchParams(window.location.search);

        const error = hashParams.get('error') || queryParams.get('error');
        const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');

        if (error || errorDesc) {
          if (mounted) {
            setErrorMsg(errorDesc || error || 'Authentication was declined or cancelled.');
          }
          return;
        }

        // 2. If PKCE authorization code is present in query parameters, exchange it for session
        const code = queryParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('OAuth code exchange error:', exchangeError);
            if (mounted) setErrorMsg(exchangeError.message);
            return;
          }
        }

        // 3. Retrieve session (Supabase client detectSessionInUrl handles hash fragment tokens)
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('OAuth redirect session error:', sessionError);
          if (mounted) setErrorMsg(sessionError.message);
          return;
        }

        // 4. Clean tokens, hashes, and query codes from the address bar
        if (window.history.replaceState) {
          const cleanPath = window.location.pathname.includes('/auth/callback')
            ? '/customer'
            : window.location.pathname;
          window.history.replaceState({}, document.title, cleanPath);
        }

        if (mounted) {
          onSuccess();
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err.message || 'Error processing authentication callback.');
        }
      }
    }

    handleAuthRedirect();

    return () => {
      mounted = false;
    };
  }, [onSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="text-center space-y-4 max-w-md w-full">
        {errorMsg ? (
          <div className="p-6 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-2xl text-sm shadow-xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-900/60 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">Authentication Notice</h3>
            <p className="text-xs text-rose-300 leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => {
                window.location.href = '/customer';
              }}
              className="mt-2 w-full px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to Resort
            </button>
          </div>
        ) : (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
            <p className="text-sm text-slate-200 font-medium">Validating Google Authentication Session...</p>
            <p className="text-xs text-slate-500">Connecting securely to Nivora Resort intelligence</p>
          </div>
        )}
      </div>
    </div>
  );
};
