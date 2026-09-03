"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Library, 
  User, 
  Film, 
  BarChart3, 
  Users, 
  ChevronRight,
  Compass,
  LogOut,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { fetchProfileData, clearCachedProfile, getCachedAuthState, setCachedAuthState, getCachedProfile } from '@/lib/profileStore';
import { clearCachedStats, clearCachedSocialCircle } from '@/lib/pageDataStore';

interface NavSection {
  title: string;
  items: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    path: string;
    badge?: string;
  }[];
}

const navSections: NavSection[] = [
  {
    title: "Discover",
    items: [
      { icon: Compass, label: 'Explore Catalog', path: '/' },
      { icon: Calendar, label: 'Upcoming', path: '/upcoming' },
    ]
  },
  {
    title: "My Vault",
    items: [
      { icon: Library, label: 'Collection', path: '/collection' },
      { icon: BarChart3, label: 'Analytics & Stats', path: '/stats' },
    ]
  },
  {
    title: "Community",
    items: [
      { icon: Users, label: 'Social Circle', path: '/friends' },
      { icon: User, label: 'Profile & Settings', path: '/profile' },
    ]
  }
];

const mobileNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Upcoming', path: '/upcoming' },
  { icon: Library, label: 'Collection', path: '/collection' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const cachedProfile = getCachedProfile();
  const cachedAuth = getCachedAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    cachedAuth !== null ? cachedAuth : !!cachedProfile?.user
  );
  const [pendingCount, setPendingCount] = useState<number>(cachedProfile?.pendingCount || 0);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!isMounted) return;
      const isAuth = !!user;
      setIsAuthenticated(isAuth);
      setCachedAuthState(isAuth);

      if (user) {
        const data = await fetchProfileData(false);
        if (isMounted && data) {
          setPendingCount(data.pendingCount);
        }
      } else {
        if (isMounted) setPendingCount(0);
      }
    };

    checkAuthAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const isAuth = !!session?.user;
      setIsAuthenticated(isAuth);
      setCachedAuthState(isAuth);

      if (session?.user) {
        const updated = await fetchProfileData(true);
        if (isMounted && updated) {
          setPendingCount(updated.pendingCount);
        }
      } else {
        if (isMounted) setPendingCount(0);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    clearCachedProfile();
    clearCachedStats();
    clearCachedSocialCircle();
    setCachedAuthState(false);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Modern Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-white/10 bg-neutral-950/70 backdrop-blur-2xl px-5 py-6 z-40 select-none justify-between">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/[0.07] to-transparent pointer-events-none" />

        {/* Top Branding & Nav */}
        <div>
          <Link to="/" className="flex items-center gap-3.5 px-2 py-1.5 mb-8 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/30 rounded-2xl blur-xs group-hover:bg-primary/50 transition-all" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-[#FFE799] via-primary to-[#D69E0A] rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 border border-white/20 group-hover:scale-105 transition-transform">
                <Film className="text-black/90" size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white font-['Poppins']">
                SMDB
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider font-semibold uppercase">
                Cinema Log & Vault
              </span>
            </div>
          </Link>

          {/* Grouped Navigation */}
          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    const showBadge = item.path === '/friends' && pendingCount > 0;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-sm font-semibold",
                          isActive
                            ? "text-black font-bold shadow-md shadow-primary/10"
                            : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="desktop-active-pill"
                            className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/25 -z-10"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          />
                        )}

                        <div className="flex items-center gap-3">
                          <Icon
                            size={18}
                            className={cn(
                              "transition-transform duration-200 group-hover:scale-110",
                              isActive
                                ? "text-black"
                                : "text-muted-foreground group-hover:text-primary"
                            )}
                          />
                          <span>{item.label}</span>
                        </div>

                        {showBadge && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide",
                            isActive 
                              ? "bg-black text-primary border border-black/30" 
                              : "bg-red-500 text-white animate-pulse"
                          )}>
                            {pendingCount} new
                          </span>
                        )}

                        {!isActive && (
                          <ChevronRight
                            size={14}
                            className="opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all text-muted-foreground"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Auth Action (Sign Out / Sign In) & Footer Links */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 text-sm font-semibold transition-all group"
            >
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-primary text-black font-bold text-sm transition-all hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              <LogIn size={18} />
              <span>Sign In / Register</span>
            </Link>
          )}

          <div className="flex items-center justify-between px-2 text-[11px] text-muted-foreground/70">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">Support</Link>
            <span>•</span>
            <span className="text-[10px]">v1.1</span>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Pill Navigation */}
      <div className="lg:hidden fixed bottom-2 sm:bottom-2.5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none pb-[env(safe-area-inset-bottom)] transform-gpu">
        <nav className="pointer-events-auto w-full max-w-sm h-[60px] bg-neutral-950/95 backdrop-blur-xl border border-white/15 rounded-full px-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.85)] flex items-center justify-between ring-1 ring-white/10 transform-gpu">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-11 rounded-full select-none transform-gpu transition-colors duration-200 active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground active:text-white"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-250 ease-out -z-10",
                    isActive 
                      ? "bg-primary/15 border border-primary/30 opacity-100 scale-100" 
                      : "opacity-0 scale-90 pointer-events-none"
                  )}
                />

                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative">
                    <Icon
                      size={18}
                      className={cn(
                        "transition-transform duration-200 transform-gpu",
                        isActive ? "scale-110 text-primary" : "text-muted-foreground"
                      )}
                    />
                    {item.path === '/profile' && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full border-3 border-neutral-950" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[9.5px] font-semibold tracking-tight transition-colors duration-200",
                      isActive ? "text-primary font-bold" : "text-muted-foreground/80"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};