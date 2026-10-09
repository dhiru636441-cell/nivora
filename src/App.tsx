/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { Navbar } from './components/layout/Navbar';
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { StaffPortal } from './pages/staff/StaffPortal';
import { FrontDeskPortal } from './pages/frontdesk/FrontDeskPortal';
import { AccessDenied } from './pages/AccessDenied';
import { AuthCallback } from './pages/AuthCallback';
import { Loader2 } from 'lucide-react';

type PortalType = 'customer' | 'staff' | 'front_desk';

function MainRouter() {
  const { user, role, isLoading, canAccessPortal } = useAuth();
  
  // Resolve initial portal from current URL path
  const resolvePortalFromPath = (): PortalType => {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('/staff')) return 'staff';
    if (p.includes('/front-desk') || p.includes('/frontdesk')) return 'front_desk';
    return 'customer';
  };

  const [currentPortal, setCurrentPortal] = useState<PortalType>(resolvePortalFromPath());
  const [isCallbackRoute, setIsCallbackRoute] = useState(
    window.location.pathname.includes('/auth/callback') || window.location.hash.includes('access_token=')
  );

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPortal(resolvePortalFromPath());
      setIsCallbackRoute(
        window.location.pathname.includes('/auth/callback') || window.location.hash.includes('access_token=')
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigatePortal = (target: PortalType) => {
    setCurrentPortal(target);
    const path = target === 'front_desk' ? '/front-desk' : `/${target}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  if (isCallbackRoute) {
    return (
      <AuthCallback
        onSuccess={() => {
          setIsCallbackRoute(false);
          navigatePortal(role === 'front_desk' ? 'front_desk' : role === 'staff' ? 'staff' : 'customer');
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-serif text-white">Nivora Resort & Residences</p>
        <p className="text-xs text-slate-400">Verifying authorized hotel credentials...</p>
      </div>
    );
  }

  // Role-Based Access Enforcement
  // 1. Customers can ONLY access customer portal
  // 2. Staff can ONLY access staff portal
  // 3. Front Desk members can ONLY access front desk portal
  const isAuthorized = canAccessPortal(currentPortal);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 text-slate-500 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Nivora Resort & Residences. Hotel Intelligence System.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Enterprise Security</span>
            <span>·</span>
            <span>Row Level Access Control</span>
            <span>·</span>
            <span>Front Desk Dispatch</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
