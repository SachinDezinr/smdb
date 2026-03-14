"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Heart, Clock, Settings, LogOut, User, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showSuccess } from '@/utils/toast';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Bookmark, label: 'Watchlist', path: '/watchlist' },
  { icon: Heart, label: 'Collection', path: '/collection' },
  { icon: Clock, label: 'Upcoming', path: '/upcoming' },
];

export const Navigation = () => {
  const location = useLocation();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
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
      <aside className="hidden lg:flex flex-col w-72 bg-background border-r border-white/5 p-6 sticky top-0 h-screen">
        <div className="mb-10 px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Film className="text-black" size={24} />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight">SMDB</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="px-4 mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Menu</div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
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
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                  <User className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{user.email}</p>
                  <p className="text-[10px] text-muted-foreground">Premium Member</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-primary text-black font-bold text-sm hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
            >
              <User size={20} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-3 rounded-2xl transition-all",
              location.pathname === item.path ? "bg-primary text-black" : "text-muted-foreground"
            )}
          >
            <item.icon size={24} />
          </Link>
        ))}
        <Link
          to={user ? "/profile" : "/auth"}
          className={cn(
            "p-3 rounded-2xl transition-all",
            location.pathname === "/auth" || location.pathname === "/profile" ? "bg-primary text-black" : "text-muted-foreground"
          )}
        >
          <User size={24} />
        </Link>
      </nav>
    </>
  );
};