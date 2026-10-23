import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { useCart } from '../../lib/cart-context';
import { AuthModal } from '../auth/AuthModal';
import { StaffAuthModal } from '../auth/StaffAuthModal';
import { FrontDeskAuthModal } from '../auth/FrontDeskAuthModal';
import { ExcelImporterModal } from '../analytics/ExcelImporterModal';
import { db } from '../../lib/db';
import {
  LogOut,
  User,
  ChevronDown,
  FileSpreadsheet,
  Sun,
  Moon,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Building2,
  Briefcase,
  Palmtree,
  ArrowRight,
} from 'lucide-react';

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
  const { user, role, signOut, isProfileComplete } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { itemCount, openCart } = useCart();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showCustomerAuthModal, setShowCustomerAuthModal] = useState(false);
  const [showStaffAuthModal, setShowStaffAuthModal] = useState(false);
  const [showFrontDeskAuthModal, setShowFrontDeskAuthModal] = useState(false);
  const [showImporterModal, setShowImporterModal] = useState(false);

  // Portal Branding Title
  const getBrandTitle = () => {
    if (currentPortal === 'staff') return 'NIVORA STAFF';
    if (currentPortal === 'front_desk') return 'NIVORA FRONT DESK';
    return 'NIVORA';
  };

  const getBrandSubtitle = () => {
    if (currentPortal === 'staff') return 'Staff & Housekeeping Console';
    if (currentPortal === 'front_desk') return 'Front Desk Intelligence';
    return 'Resort & Residences';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#12382D] text-[#F7F3EA] border-b border-[#C7A36A]/25 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-18">
            
            {/* Zone 1: Single Brand Wordmark */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => onNavigatePortal(currentPortal)}
                className="text-left group cursor-pointer focus:outline-none flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full border border-[#C7A36A] flex items-center justify-center bg-[#0D2820] text-[#C7A36A] text-xs font-serif font-semibold shadow-xs">
                  {currentPortal === 'staff' ? 'S' : currentPortal === 'front_desk' ? 'FD' : 'N'}
                </div>
                <div>
                  <span className="font-serif text-xl sm:text-2xl font-normal tracking-[0.2em] text-[#F7F3EA] group-hover:text-[#C7A36A] transition-colors">
                    {getBrandTitle()}
                  </span>
                  <span className="block text-[9px] uppercase tracking-[0.25em] text-[#C7A36A] font-sans">
                    {getBrandSubtitle()}
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Navigation Links (Clean typography, no garish capsules) */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wider uppercase">
              {portalTabs.length > 0 && (
                portalTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`py-2 transition-all whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[#C7A36A] text-[#F7F3EA] font-semibold'
                        : 'border-transparent text-[#A9B8A4] hover:text-[#F7F3EA]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))
              )}
            </nav>

            {/* Zone 3: Primary Action & User Profile */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Working Light / Dark Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle visual theme"
                className="p-2 rounded-lg border border-[#C7A36A]/30 text-[#F7F3EA] hover:bg-white/10 transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to Luxury Light Mode (Ivory)' : 'Switch to Dark Mode (Charcoal)'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#C7A36A]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#C7A36A]" />
                )}
              </button>

              {/* Shopping Cart Button - Shown only on Customer portal */}
              {currentPortal === 'customer' && (
                <button
                  onClick={openCart}
                  aria-label="View Culinary Cart"
                  className="relative p-2 rounded-lg border border-[#C7A36A]/30 text-[#F7F3EA] hover:bg-white/10 transition-colors cursor-pointer"
                  title="View Culinary Cart"
                >
                  <ShoppingBag className="w-4 h-4 text-[#C7A36A]" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C7A36A] text-[#12382D] font-bold text-[10px] flex items-center justify-center animate-in zoom-in-50">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}

              {/* Excel dataset importer shortcut strictly for authorized staff and front desk in their portals */}
              {(role === 'staff' || role === 'front_desk') && (currentPortal === 'staff' || currentPortal === 'front_desk') && (
                <button
                  onClick={() => setShowImporterModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0D2820] hover:bg-[#081B15] border border-[#C7A36A]/30 rounded-lg text-xs text-[#F7F3EA] transition-colors cursor-pointer"
                  title="Inspect and Import Excel Dataset"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#C7A36A]" />
                  <span>Import Dataset</span>
                </button>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0D2820] border border-[#C7A36A]/40 hover:border-[#C7A36A] transition-colors text-left cursor-pointer"
                    aria-expanded={showRoleMenu}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#12382D] border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] text-xs font-serif font-bold">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden lg:block text-xs">
                      <p className="font-medium text-[#F7F3EA] leading-tight truncate max-w-[120px]">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-[#C7A36A] uppercase tracking-wider font-semibold">
                        {db.isSuperAdmin(user.email)
                          ? 'Executive Admin'
                          : role === 'front_desk'
                          ? 'Front Desk'
                          : role === 'staff'
                          ? 'Staff'
                          : 'Guest'}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#C7A36A]" />
                  </button>

                  {showRoleMenu && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#191D19] border border-[#C7A36A]/30 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-[#F7F3EA]">
                      <div className="px-3 py-2 border-b border-[#C7A36A]/20">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-[#A9B8A4]">Signed in as</p>
                          {db.isSuperAdmin(user.email) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-[#C7A36A]/20 text-[#C7A36A] border border-[#C7A36A]/40">
                              <Sparkles className="w-2.5 h-2.5" />
                              All Portals
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#F7F3EA] truncate">{user.email}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#A9B8A4]">
                          <span>Active Mode:</span>
                          <span className="font-semibold text-[#C7A36A] capitalize">
                            {currentPortal === 'front_desk'
                              ? 'Front Desk Management'
                              : currentPortal === 'staff'
                              ? 'Staff Operations'
                              : 'Guest Sanctuary'}
                          </span>
                        </div>
                      </div>

                      {/* Executive Multi-Portal Switcher for Authorized Admin Only */}
                      {db.isSuperAdmin(user.email) && (
                        <div className="py-2 border-b border-[#C7A36A]/20">
                          <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#C7A36A] mb-1.5">
                            Executive Portal Switch
                          </p>
                          <div className="space-y-1">
                            <button
                              onClick={() => {
                                onNavigatePortal('customer');
                                setShowRoleMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                                currentPortal === 'customer'
                                  ? 'bg-[#C7A36A]/20 text-[#F7F3EA] font-semibold'
                                  : 'text-[#A9B8A4] hover:bg-white/5 hover:text-[#F7F3EA]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Palmtree className="w-3.5 h-3.5 text-[#C7A36A]" />
                                <span>Guest Sanctuary Portal</span>
                              </span>
                              {currentPortal === 'customer' && <span className="text-[10px] text-[#C7A36A]">Active</span>}
                            </button>

                            <button
                              onClick={() => {
                                onNavigatePortal('staff');
                                setShowRoleMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                                currentPortal === 'staff'
                                  ? 'bg-[#C7A36A]/20 text-[#F7F3EA] font-semibold'
                                  : 'text-[#A9B8A4] hover:bg-white/5 hover:text-[#F7F3EA]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-[#C7A36A]" />
                                <span>Staff Operations Portal</span>
                              </span>
                              {currentPortal === 'staff' && <span className="text-[10px] text-[#C7A36A]">Active</span>}
                            </button>

                            <button
                              onClick={() => {
                                onNavigatePortal('front_desk');
                                setShowRoleMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                                currentPortal === 'front_desk'
                                  ? 'bg-[#C7A36A]/20 text-[#F7F3EA] font-semibold'
                                  : 'text-[#A9B8A4] hover:bg-white/5 hover:text-[#F7F3EA]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-[#C7A36A]" />
                                <span>Front Desk Management</span>
                              </span>
                              {currentPortal === 'front_desk' && <span className="text-[10px] text-[#C7A36A]">Active</span>}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Guest-Specific Menu Items (Profile) */}
                      {(role === 'customer' || db.isSuperAdmin(user.email)) && currentPortal === 'customer' && (
                        <div className="py-2 border-b border-[#C7A36A]/20">
                          <button
                            onClick={() => {
                              onTabChange?.('profile');
                              setShowRoleMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#F7F3EA] hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <User className="w-3.5 h-3.5 text-[#C7A36A]" />
                            <span>My Sanctuary Profile</span>
                          </button>
                        </div>
                      )}

                      {/* Employee Operational Notice for non-admin staff/frontdesk */}
                      {!db.isSuperAdmin(user.email) && role !== 'customer' && (
                        <div className="py-2 border-b border-[#C7A36A]/20 px-3 text-[11px] text-[#A9B8A4]">
                          <span className="flex items-center gap-1.5 text-[#C7A36A] font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Employee Session Verified</span>
                          </span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            signOut();
                            setShowRoleMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated Login Buttons Tailored to Portal */
                currentPortal === 'staff' ? (
                  <button
                    onClick={() => setShowStaffAuthModal(true)}
                    className="px-4 py-2 text-xs font-medium text-white bg-[#12382D] hover:bg-[#0E2C23] border border-[#C7A36A]/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                  >
                    Staff Sign In
                  </button>
                ) : currentPortal === 'front_desk' ? (
                  <button
                    onClick={() => setShowFrontDeskAuthModal(true)}
                    className="px-4 py-2 text-xs font-medium text-white bg-[#12382D] hover:bg-[#0E2C23] border border-[#C7A36A]/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                  >
                    Front Desk Sign In
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCustomerAuthModal(true)}
                    className="px-4 py-2 text-xs font-medium text-[#12382D] bg-[#C7A36A] hover:bg-[#D9BB8A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                  >
                    Sign In / Register
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Customer Auth Modal (Guest only) */}
      <AuthModal
        isOpen={showCustomerAuthModal}
        onClose={() => setShowCustomerAuthModal(false)}
      />

      {/* Staff Auth Modal (Staff only) */}
      <StaffAuthModal
        isOpen={showStaffAuthModal}
        onClose={() => setShowStaffAuthModal(false)}
        onSuccess={() => onNavigatePortal('staff')}
      />

      {/* Front Desk Auth Modal (Front Desk only) */}
      <FrontDeskAuthModal
        isOpen={showFrontDeskAuthModal}
        onClose={() => setShowFrontDeskAuthModal(false)}
        onSuccess={() => onNavigatePortal('front_desk')}
      />

      {/* Excel Dataset Importer Modal */}
      <ExcelImporterModal
        isOpen={showImporterModal}
        onClose={() => setShowImporterModal(false)}
      />
    </>
  );
};
