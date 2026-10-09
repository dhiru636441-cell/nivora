import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { UserRole } from '../lib/types';

interface AccessDeniedProps {
  requiredRole: 'customer' | 'staff' | 'front_desk';
  onNavigatePortal: (portal: 'customer' | 'staff' | 'front_desk') => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole, onNavigatePortal }) => {
  const { role, user, switchProvisionedRole } = useAuth();

  const getPortalLabel = (r: 'customer' | 'staff' | 'front_desk') => {
    switch (r) {
      case 'customer':
        return 'Customer Portal';
      case 'staff':
        return 'Staff Operations Portal';
      case 'front_desk':
        return 'Front Desk Intelligence Portal';
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-950/50 border border-rose-800/50 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-white mb-2">Restricted Access</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The <span className="text-slate-200 font-medium">{getPortalLabel(requiredRole)}</span> requires authorized permissions. Your account (<span className="text-cyan-400 font-medium">{user?.email || 'Guest'}</span>) is currently assigned the role of <span className="text-slate-200 capitalize font-medium">{role.replace('_', ' ')}</span> in the database.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onNavigatePortal(role === 'front_desk' ? 'front_desk' : role === 'staff' ? 'staff' : 'customer')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Authorized {role === 'customer' ? 'Customer' : role === 'staff' ? 'Staff' : 'Front Desk'} Portal</span>
          </button>

          {/* Quick role-switch simulation for administrators/testing */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-2">Authorized Provisioning Switcher</p>
            <button
              onClick={() => switchProvisionedRole(requiredRole as UserRole)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Provision My Account as {getPortalLabel(requiredRole)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
