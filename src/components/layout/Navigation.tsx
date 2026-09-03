"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Library, 
  User, 
  Film, 
  BarChart3, 
  Users, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { getCachedProfile, fetchProfileData } from '@/lib/profileStore';
import { getUserBadge } from '@/lib/badges';

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

/**
 * Navigation Component: Handles both Desktop Sidebar and Mobile Floating Pill Navigation.
 */
export const Navigation = () => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [profile, setProfile] = useState<any>(getCachedProfile());

  useEffect(() => {
    const loadProfileAndRequests = async () => {
      const data = await fetchProfileData(false);
      if (data) {
        setProfile(data);
        setPendingCount(data.pendingCount);
      }
    };
    loadProfileAndRequests();

    // Listen for friend updates
    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      const updated = await fetchProfileData(true);
      if (updated) {
        setProfile(updated);
        setPendingCount(updated.pendingCount);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const userInitial = (profile?.username || profile?.user?.email || 'U')[0].toUpperCase();
  const badgeInfo = getUserBadge(profile?.watchedCount || 0);

  return (
    <>
      {/* Desktop Modern Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-white/10 bg-neutral-950/70 backdrop-blur-2xl px-5 py-6 z-40 select-none justify-between">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/[0.07] to-transparent pointer-events-none" />

        {/* Top Branding */}
        <div>
          <Link to="/" className="flex items-center gap-3.5 px-2 py-1.5 mb-8 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/30 rounded-2xl blur-xs group-hover:bg-primary/50 transition-all" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-[#FFE799] via-primary to-[#D69E0A] rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 border border-white/20 group-hover:scale-105 transition-transform">
                <Film className="text-black/90" size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-['Poppins']">
                SMDB
                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 font-bold">
                  PRO
                </span>
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
                        {/* Animated Active Pill Background */}
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

                        {/* Request Notification Badge */}
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

                        {/* Hover arrow indicator on inactive */}
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

        {/* Bottom User Card / Profile Badge */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-primary/30 transition-all group"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 via-neutral-800 to-primary/40 border border-primary/40 flex items-center justify-center font-bold text-primary text-sm shadow-md">
                {userInitial}
              </div>
              <span className="absolute -bottom-1 -right-1 p-0.5 bg-neutral-900 rounded-full border border-primary/30 text-primary">
                <ShieldCheck size={11} />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                {profile?.username || 'Cinephile'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-medium flex items-center gap-1">
                <Sparkles size={10} className="text-primary" />
                {badgeInfo.current.label}
              </p>
            </div>

            <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>

          {/* Quick Footer Links */}
          <div className="flex items-center justify-between px-2 text-[11px] text-muted-foreground/70">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">Support</Link>
            <span>•</span>
            <span className="text-[10px]">v1.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Pill Navigation */}
      <div className="lg:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-sm h-16 bg-neutral-950/85 backdrop-blur-2xl border border-white/15 rounded-full px-2 shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex items-center justify-between ring-1 ring-white/10">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-12 rounded-full transition-all duration-300 group select-none",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-full shadow-[0_0_14px_rgba(245,197,24,0.2)]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <div className="relative">
                    <Icon
                      size={19}
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(245,197,24,0.5)]" : "text-muted-foreground group-hover:text-white"
                      )}
                    />
                    {item.path === '/profile' && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-950 animate-pulse" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-tight transition-colors duration-200",
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