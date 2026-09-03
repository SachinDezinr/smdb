"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Library, User, Film, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

const desktopNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Upcoming', path: '/upcoming' },
  { icon: Library, label: 'Collection', path: '/collection' },
  { icon: BarChart3, label: 'Stats', path: '/stats' },
  { icon: Users, label: 'Friends', path: '/friends' },
  { icon: User, label: 'Profile', path: '/profile' },
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
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

  // Check for pending friend requests to show notification dot
  useEffect(() => {
    const checkRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('friends')
        .select('id')
        .eq('friend_id', user.id)
        .eq('status', 'pending');
      
      setHasPendingRequests(data && data.length > 0);
    };
    checkRequests();
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-white/10 bg-background/50 backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Film className="text-black" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-primary">SMDB</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {desktopNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                location.pathname === item.path 
                  ? "bg-primary text-black font-semibold shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="relative">
                <item.icon size={20} className={cn(
                  "transition-transform duration-300 group-hover:scale-110",
                  location.pathname === item.path ? "text-black" : "text-primary"
                )} />
                {/* Desktop: Dot on Friends icon */}
                {item.path === '/friends' && hasPendingRequests && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Footer Section */}
        <div className="pt-6 border-t border-white/10">
          <div className="px-2 text-[10px] text-muted-foreground leading-relaxed">
            <p>© 2026 SMDB. All Rights Reserved.</p>
            <p className="mt-1 opacity-50">Unauthorized copying of code, design, or content is strictly prohibited.</p>
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
                    {item.path === '/profile' && hasPendingRequests && (
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