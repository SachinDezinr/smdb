"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Film, Clock, User, Bookmark, Users, BarChart3, Info, Mail, Layers, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showSuccess } from '@/utils/toast';

const MAIN_NAV = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Clock, label: 'Upcoming', path: '/upcoming' },
  { icon: Layers, label: 'Collection', path: '/collection' },
  { icon: Bookmark, label: 'Watchlist', path: '/watchlist' },
];

const SECONDARY_NAV = [
  { icon: Users, label: 'Friends', path: '/friends' },
  { icon: BarChart3, label: 'Stats', path: '/stats' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Navigation = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('friends')
          .select('id')
          .eq('friend_id', user.id)
          .eq('status', 'pending');
        setPendingRequests(data?.length || 0);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess("Logged out successfully");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-background border-r border-white/5 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-10 px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Film className="text-black" size={24} />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight">SMDB</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-8">
          <div className="space-y-2">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  location.pathname === item.path 
                    ? "bg-primary text-black shadow-lg shadow-primary/10" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-transform duration-300 group-hover:scale-110",
                  location.pathname === item.path ? "text-black" : "text-primary"
                )} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="space-y-2">
            <div className="px-4 mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Social & Stats</div>
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
                  location.pathname === item.path 
                    ? "bg-primary text-black shadow-lg shadow-primary/10" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="relative">
                  <item.icon size={20} className={cn(
                    "transition-transform duration-300 group-hover:scale-110",
                    location.pathname === item.path ? "text-black" : "text-primary"
                  )} />
                  {item.label === 'Friends' && pendingRequests > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          {user && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-white/5 px-4 h-16 flex justify-between items-center z-50">
        {MAIN_NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              location.pathname === item.path ? "bg-primary text-black" : "text-muted-foreground"
            )}
          >
            <item.icon size={22} />
          </Link>
        ))}
        <Link
          to={user ? "/profile" : "/auth"}
          className={cn(
            "p-2.5 rounded-xl transition-all relative",
            location.pathname === "/profile" ? "bg-primary text-black" : "text-muted-foreground"
          )}
        >
          <User size={22} />
          {pendingRequests > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
          )}
        </Link>
      </nav>
    </>
  );
};