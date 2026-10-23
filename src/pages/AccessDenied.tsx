import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { AuthModal } from '../components/auth/AuthModal';
import { StaffAuthModal } from '../components/auth/StaffAuthModal';
import { FrontDeskAuthModal } from '../components/auth/FrontDeskAuthModal';

interface AccessDeniedProps {
  requiredRole: 'customer' | 'staff' | 'front_desk';
  onNavigatePortal: (portal: 'customer' | 'staff' | 'front_desk') => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole, onNavigatePortal }) => {
  const { role, user, signOut } = useAuth();
  const [showCustomerAuth, setShowCustomerAuth] = useState(false);
  const [showStaffAuth, setShowStaffAuth] = useState(false);
  const [showFrontDeskAuth, setShowFrontDeskAuth] = useState(false);

  const getPortalLabel = (r: 'customer' | 'staff' | 'front_desk') => {
    switch (r) {
      case 'customer':
        return 'Guest Sanctuary Portal';
      case 'staff':
        return 'Staff Operations Portal';
      case 'front_desk':
        return 'Front Desk Intelligence Portal';
    }
  };

  const openAppropriateLogin = () => {
    if (requiredRole === 'staff') {
      setShowStaffAuth(true);
    } else if (requiredRole === 'front_desk') {
      setShowFrontDeskAuth(true);
    } else {
      setShowCustomerAuth(true);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-2xl p-8 sm:p-10 text-center shadow-xl space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#12382D] border border-[#C7A36A] flex items-center justify-center text-[#C7A36A]">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">
              Restricted Portal Access
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#12382D] dark:text-[#F7F3EA] mt-1 mb-2">
              Authentication Required
            </h2>
            <p className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] leading-relaxed">
              The <span className="text-[#12382D] dark:text-[#F7F3EA] font-semibold">{getPortalLabel(requiredRole)}</span> requires verified credentials. Please sign in with an authorized account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={openAppropriateLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#12382D] hover:bg-[#0E2C23] text-white font-medium rounded-xl text-xs transition-colors cursor-pointer shadow-xs border border-[#C7A36A]/30"
            >
              <LogIn className="w-3.5 h-3.5 text-[#C7A36A]" />
              <span>
                {requiredRole === 'staff'
                  ? 'Staff Operations Sign In'
                  : requiredRole === 'front_desk'
                  ? 'Front Desk Sign In'
                  : 'Customer Sign In / Register'}
              </span>
            </button>

            <button
              onClick={() => onNavigatePortal('customer')}
              className="w-full py-2 text-xs text-[#242722]/60 dark:text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-[#F7F3EA] transition-colors cursor-pointer"
            >
              Return to Guest Sanctuary
            </button>
          </div>

          {/* Render specific modal based on required role */}
          <AuthModal
            isOpen={showCustomerAuth}
            onClose={() => setShowCustomerAuth(false)}
          />
          <StaffAuthModal
            isOpen={showStaffAuth}
            onClose={() => setShowStaffAuth(false)}
            onSuccess={() => onNavigatePortal('staff')}
          />
          <FrontDeskAuthModal
            isOpen={showFrontDeskAuth}
            onClose={() => setShowFrontDeskAuth(false)}
            onSuccess={() => onNavigatePortal('front_desk')}
          />
        </div>
      </div>
    );
  }

  // Authenticated user attempting to access a portal they are NOT authorized for
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white dark:bg-[#1E231E] border border-rose-300 dark:border-rose-900/60 rounded-2xl p-8 sm:p-10 text-center shadow-xl space-y-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-rose-600 dark:text-rose-400 font-semibold">
            Access Restricted
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#12382D] dark:text-[#F7F3EA] mt-1 mb-2">
            You are not authorized to access this portal
          </h2>
          <p className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] leading-relaxed">
            The <span className="font-semibold text-[#12382D] dark:text-[#F7F3EA]">{getPortalLabel(requiredRole)}</span> requires verified privileges. Your current session (<span className="text-[#C7A36A] font-medium">{user.email}</span>) is assigned the role of <span className="capitalize font-semibold text-[#12382D] dark:text-[#F7F3EA]">{role.replace('_', ' ')}</span>.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Direct Return Button to User's Authorized Dashboard */}
          <button
            onClick={() => onNavigatePortal(role === 'front_desk' ? 'front_desk' : role === 'staff' ? 'staff' : 'customer')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#12382D] hover:bg-[#0E2C23] text-white font-medium rounded-xl text-xs transition-colors cursor-pointer shadow-xs border border-[#C7A36A]/30"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#C7A36A]" />
            <span>
              Return to Your Authorized {role === 'front_desk' ? 'Front Desk Portal' : role === 'staff' ? 'Staff Portal' : 'Guest Sanctuary'}
            </span>
          </button>

          {/* Switch Account */}
          <button
            onClick={async () => {
              await signOut();
              openAppropriateLogin();
            }}
            className="w-full py-2 text-xs text-[#242722]/60 dark:text-[#A9B8A4] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            Sign in with a different account
          </button>
        </div>

        {/* Modals for signing in with alternative account */}
        <AuthModal
          isOpen={showCustomerAuth}
          onClose={() => setShowCustomerAuth(false)}
        />
        <StaffAuthModal
          isOpen={showStaffAuth}
          onClose={() => setShowStaffAuth(false)}
          onSuccess={() => onNavigatePortal('staff')}
        />
        <FrontDeskAuthModal
          isOpen={showFrontDeskAuth}
          onClose={() => setShowFrontDeskAuth(false)}
          onSuccess={() => onNavigatePortal('front_desk')}
        />
      </div>
    </div>
  );
};
