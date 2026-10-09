import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '../../lib/types';
import { AuthModal } from '../auth/AuthModal';
import { ExcelImporterModal } from '../analytics/ExcelImporterModal';
import { ShieldCheck, LogOut, User, KeyRound, Sparkles, AlertCircle, ChevronDown, Check, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  currentPortal: 'customer' | 'staff' | 'front_desk';
  onNavigatePortal: (portal: 'customer' | 'staff' | 'front_desk') => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  portalTabs?: Array<{ id: string; label: string }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPortal,
  onNavigatePortal,
  activeTab,
  onTabChange,
  portalTabs = [],
}) => {
  const { user, role, signOut, signInGoogle, switchProvisionedRole, isSupabaseConnected } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImporterModal, setShowImporterModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8 h-16">
            {/* Zone 1: Single Brand Wordmark */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => onNavigatePortal('customer')}
                className="text-left group cursor-pointer focus:outline-none"
              >
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  Nivora
                </span>
                <span className="text-xs text-cyan-400 font-sans tracking-widest uppercase ml-2 hidden sm:inline">
                  Resort & Residences
                </span>
              </button>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              {portalTabs.length > 0 ? (
                portalTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`text-sm tracking-wide transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-white font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => onNavigatePortal('customer')}
                    className={`text-sm transition-colors whitespace-nowrap shrink-0 ${
                      currentPortal === 'customer' ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Guest Portal
                  </button>
                  <button
                    onClick={() => onNavigatePortal('staff')}
                    className={`text-sm transition-colors whitespace-nowrap shrink-0 ${
                      currentPortal === 'staff' ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Staff Operations
                  </button>
                  <button
                    onClick={() => onNavigatePortal('front_desk')}
                    className={`text-sm transition-colors whitespace-nowrap shrink-0 ${
                      currentPortal === 'front_desk' ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Front Desk Intelligence
                  </button>
                </>
              )}
            </nav>

            {/* Zone 3: Primary Action */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Excel dataset importer shortcut for staff and front desk */}
              {(role === 'staff' || role === 'front_desk') && (
                <button
                  onClick={() => setShowImporterModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors"
                  title="Inspect and Import Excel Dataset"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import Excel</span>
                </button>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-left"
                    aria-expanded={showRoleMenu}
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 text-xs font-semibold">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden lg:block text-xs">
                      <p className="font-medium text-slate-200 leading-tight truncate max-w-[120px]">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-cyan-400 uppercase tracking-wider capitalize">
                        {role.replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showRoleMenu && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-100 truncate">{user.email}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Database Role:</span>
                          <span className="font-semibold text-cyan-300 capitalize">{role.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="py-2">
                        <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">
                          Portal Navigation
                        </p>
                        <button
                          onClick={() => {
                            onNavigatePortal('customer');
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            currentPortal === 'customer'
                              ? 'bg-slate-800 text-cyan-300 font-medium'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span>Customer Portal</span>
                          {currentPortal === 'customer' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            onNavigatePortal('staff');
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            currentPortal === 'staff'
                              ? 'bg-slate-800 text-cyan-300 font-medium'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span>Staff Portal</span>
                          {currentPortal === 'staff' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            onNavigatePortal('front_desk');
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            currentPortal === 'front_desk'
                              ? 'bg-slate-800 text-cyan-300 font-medium'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span>Front Desk Portal</span>
                          {currentPortal === 'front_desk' && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Operational Role Switcher (Authorized provisioning testing) */}
                      <div className="py-2 border-t border-slate-800">
                        <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">
                          Authorized Role Testing
                        </p>
                        <div className="grid grid-cols-3 gap-1 px-2">
                          {(['customer', 'staff', 'front_desk'] as UserRole[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => {
                                switchProvisionedRole(r);
                                setShowRoleMenu(false);
                              }}
                              className={`py-1 px-1.5 text-[11px] rounded transition-colors text-center capitalize ${
                                role === r
                                  ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 font-semibold'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {r === 'front_desk' ? 'Front Desk' : r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            signOut();
                            setShowRoleMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-950 cursor-pointer"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal (Google, Email/Password, Phone OTP with India +91) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Excel Dataset Importer Modal */}
      <ExcelImporterModal
        isOpen={showImporterModal}
        onClose={() => setShowImporterModal(false)}
      />
    </>
  );
};

