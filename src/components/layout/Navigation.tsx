"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Library, 
  Bookmark, 
  User, 
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export const Navigation = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) checkNotifications(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkNotifications(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkNotifications = async (userId: string) => {
    const { count } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    setHasNotifications((count || 0) > 0);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Upcoming', path: '/upcoming' },
    { icon: Library, label: 'Collection', path: '/collection' },
    { icon: Bookmark, label: 'Watchlist', path: '/watchlist' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-neutral-950 border-r border-white/5 h-screen sticky top-0 p-8">
        <div className="mb-12">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <span className="text-black font-black text-xl">S</span>
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight">SMDB</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4 px-4">Menu</p>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                isActive(item.path) 
                  ? "bg-primary text-black shadow-lg shadow-primary/10" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive(item.path) ? "text-black" : "text-primary")} />
              <span className="font-bold text-sm">{item.label}</span>
            </Link>
          ))}

          <div className="pt-8 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4 px-4">Social</p>
            <Link
              to="/friends"
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive('/friends') 
                  ? "bg-primary text-black shadow-lg shadow-primary/10" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <Users size={20} className={cn("transition-transform group-hover:scale-110", isActive('/friends') ? "text-black" : "text-primary")} />
              <span className="font-bold text-sm">Friends</span>
              {hasNotifications && (
                <span className="absolute right-4 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </Link>
          </div>
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
          {user ? (
            <Link
              to="/profile"
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                isActive('/profile') 
                  ? "bg-primary text-black shadow-lg shadow-primary/10" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20">
                <User size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.user_metadata?.username || 'Profile'}</p>
                <p className="text-[10px] text-muted-foreground truncate">View Account</p>
              </div>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-primary text-black font-bold text-sm hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              <User size={20} />
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Pill Navigation - Medium Size */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[80%] max-w-sm">
        <nav className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full px-3 py-2.5 flex items-center justify-between shadow-2xl">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative p-3 rounded-full transition-all duration-300",
                isActive(item.path) ? "bg-primary text-black scale-110" : "text-muted-foreground"
              )}
            >
              <item.icon size={20} />
              {isActive(item.path) && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}
          <Link
            to="/profile"
            className={cn(
              "relative p-3 rounded-full transition-all duration-300",
              isActive('/profile') ? "bg-primary text-black scale-110" : "text-muted-foreground"
            )}
          >
            <User size={20} />
            {hasNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary border-2 border-black rounded-full" />
            )}
            {isActive('/profile') && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-primary rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        </nav>
      </div>
    </>
  );
};