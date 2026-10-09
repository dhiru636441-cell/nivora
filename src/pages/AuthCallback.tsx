import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface AuthCallbackProps {
  onSuccess: (targetPortal?: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        if (!supabase) {
          onSuccess();
          return;
        }

        // Get session from URL
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('OAuth redirect session error:', error);
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          // Clean hash from URL and proceed
          window.history.replaceState({}, document.title, window.location.pathname);
          onSuccess();
        } else {
          onSuccess();
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error processing authentication callback.');
      }
    }

    handleAuthRedirect();
  }, [onSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="text-center space-y-4">
        {errorMsg ? (
          <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-sm max-w-md">
            <p className="font-semibold mb-1">Authentication Notice</p>
            <p>{errorMsg}</p>
            <button
              onClick={() => onSuccess()}
              className="mt-3 px-4 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs"
            >
              Continue to Portal
            </button>
          </div>
        ) : (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
            <p className="text-sm text-slate-300 font-medium">Validating Google Authentication Session...</p>
            <p className="text-xs text-slate-500">Connecting securely to Nivora Resort intelligence</p>
          </>
        )}
      </div>
    </div>
  );
};
