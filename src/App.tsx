/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { ThemeProvider, useTheme } from './lib/theme-context';
import { CartProvider } from './lib/cart-context';
import { Navbar } from './components/layout/Navbar';
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { StaffPortal } from './pages/staff/StaffPortal';
import { FrontDeskPortal } from './pages/frontdesk/FrontDeskPortal';
import { CompleteProfilePage } from './pages/customer/CompleteProfilePage';
import { AccessDenied } from './pages/AccessDenied';
import { AuthCallback } from './pages/AuthCallback';
import { AuthModal } from './components/auth/AuthModal';
import { StaffAuthModal } from './components/auth/StaffAuthModal';
import { FrontDeskAuthModal } from './components/auth/FrontDeskAuthModal';
import { NiaFloatingButton } from './components/ai/NiaFloatingButton';
import { Loader2 } from 'lucide-react';

type PortalType = 'customer' | 'staff' | 'front_desk';

function MainRouter() {
  const { user, role, isLoading, isProfileComplete, canAccessPortal } = useAuth();
  const { theme } = useTheme();

  // Resolve portal from URL path
  const resolvePortalFromPath = (): PortalType => {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('/staff')) return 'staff';
    if (p.includes('/front-desk') || p.includes('/frontdesk')) return 'front_desk';
    return 'customer';
  };

  const isAuthCallbackState = () =>
    window.location.pathname.includes('/auth/callback') ||
    window.location.hash.includes('access_token=') ||
    window.location.hash.includes('error=') ||
    window.location.search.includes('code=') ||
    window.location.search.includes('error=');

  const [currentPortal, setCurrentPortal] = useState<PortalType>(resolvePortalFromPath());
  const [isCallbackRoute, setIsCallbackRoute] = useState(isAuthCallbackState());
  
  // Dedicated Separate Login Modals based on route
  const [showCustomerLogin, setShowCustomerLogin] = useState(window.location.pathname.toLowerCase() === '/login');
  const [showStaffLogin, setShowStaffLogin] = useState(window.location.pathname.toLowerCase() === '/staff/login');
  const [showFrontDeskLogin, setShowFrontDeskLogin] = useState(window.location.pathname.toLowerCase() === '/front-desk/login');

  // Sync route on browser navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const p = resolvePortalFromPath();
      setCurrentPortal(p);
      setIsCallbackRoute(isAuthCallbackState());
      const path = window.location.pathname.toLowerCase();
      setShowCustomerLogin(path === '/login');
      setShowStaffLogin(path === '/staff/login');
      setShowFrontDeskLogin(path === '/front-desk/login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigatePortal = (target: PortalType) => {
    setCurrentPortal(target);
    const path = target === 'front_desk' ? '/front-desk' : target === 'staff' ? '/staff' : '/';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  if (isCallbackRoute) {
    return (
      <AuthCallback
        onSuccess={() => {
          setIsCallbackRoute(false);
          setCurrentPortal(resolvePortalFromPath());
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F3EA] dark:bg-[#141714] flex flex-col items-center justify-center text-[#242722] dark:text-[#F7F3EA] p-4">
        <div className="w-12 h-12 rounded-full border border-[#C7A36A] flex items-center justify-center bg-[#12382D] text-[#C7A36A] mb-4 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <p className="font-serif text-2xl font-normal tracking-[0.2em] text-[#12382D] dark:text-[#F7F3EA] mb-1">
          N I V O R A
        </p>
        <p className="text-xs uppercase tracking-widest text-[#C7A36A]">
          Verifying authorized sanctuary credentials...
        </p>
      </div>
    );
  }

  // Strict Role-Based Route Authorization
  const isAuthorized = canAccessPortal(currentPortal);

  // If user is logged in as a customer with an incomplete profile, intercept all customer views
  const requiresProfileCompletion = Boolean(
    user &&
    role === 'customer' &&
    currentPortal === 'customer' &&
    !isProfileComplete
  );

  return (
    <div className="min-h-screen bg-[#F7F3EA] dark:bg-[#141714] text-[#242722] dark:text-[#F7F3EA] flex flex-col selection:bg-[#C7A36A]/30 selection:text-[#12382D] dark:selection:text-[#C7A36A] transition-colors duration-200">
      
      {/* If incomplete profile, show full-page onboarding directly */}
      {requiresProfileCompletion ? (
        <CompleteProfilePage onComplete={() => navigatePortal('customer')} />
      ) : (
        <>
          {/* Top Bar Navigation */}
          <Navbar
            currentPortal={currentPortal}
            onNavigatePortal={navigatePortal}
          />

          {/* Main Content Viewport */}
          <div className="flex-1">
            {!isAuthorized ? (
              <AccessDenied
                requiredRole={currentPortal}
                onNavigatePortal={navigatePortal}
              />
            ) : currentPortal === 'customer' ? (
              <CustomerPortal />
            ) : currentPortal === 'staff' ? (
              <StaffPortal />
            ) : (
              <FrontDeskPortal />
            )}
          </div>

          {/* Dedicated Customer Login Modal (/login) */}
          <AuthModal
            isOpen={showCustomerLogin}
            onClose={() => {
              setShowCustomerLogin(false);
              if (window.location.pathname === '/login') {
                window.history.pushState(null, '', '/');
              }
            }}
          />

          {/* Dedicated Staff Login Modal (/staff/login) */}
          <StaffAuthModal
            isOpen={showStaffLogin}
            onClose={() => {
              setShowStaffLogin(false);
              if (window.location.pathname === '/staff/login') {
                window.history.pushState(null, '', '/staff');
              }
            }}
            onSuccess={() => navigatePortal('staff')}
          />

          {/* Dedicated Front Desk Login Modal (/front-desk/login) */}
          <FrontDeskAuthModal
            isOpen={showFrontDeskLogin}
            onClose={() => {
              setShowFrontDeskLogin(false);
              if (window.location.pathname === '/front-desk/login') {
                window.history.pushState(null, '', '/front-desk');
              }
            }}
            onSuccess={() => navigatePortal('front_desk')}
          />

          {/* Luxury Editorial Footer */}
          <footer className="border-t border-[#C7A36A]/20 bg-[#12382D] text-[#F7F3EA] py-10 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div>
                  <span className="font-serif text-xl tracking-[0.2em] text-white">NIVORA</span>
                  <p className="text-[11px] text-[#A9B8A4] mt-0.5">Sovereign Peninsula Resort & Residences · Five-Star Luxury Hospitality</p>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-[#A9B8A4]">
                  <span className="hover:text-white transition-colors cursor-pointer">Bespoke Concierge</span>
                  <span>·</span>
                  <span className="hover:text-white transition-colors cursor-pointer">Peninsula Spa & Wellness</span>
                  <span>·</span>
                  <span className="hover:text-white transition-colors cursor-pointer">Private Dining</span>
                  <span>·</span>
                  <span className="hover:text-white transition-colors cursor-pointer">Sanctuary Suites</span>
                </div>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#A9B8A4]/80">
                <p>© {new Date().getFullYear()} Nivora Resort & Residences. All rights reserved.</p>
                
                {/* Discrete links for staff and front desk employee portals */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigatePortal('customer')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Guest Sanctuary
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => navigatePortal('staff')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Staff Portal
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => navigatePortal('front_desk')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Front Desk Portal
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Floating Action Button for Nia AI - Persistent across all customer-facing views */}
      {currentPortal === 'customer' && <NiaFloatingButton />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MainRouter />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
