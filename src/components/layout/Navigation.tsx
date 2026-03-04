"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Library, User, Info, Mail, Film, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Upcoming', path: '/upcoming' },
  { icon: Library, label: 'Collection', path: '/collection' },
  { icon: BarChart3, label: 'Stats', path: '/stats' },
  { icon: Users, label: 'Friends', path: '/friends' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const footerItems = [
  { icon: Info, label: 'About', path: '/about' },
  { icon: Mail, label: 'Contact', path: '/contact' },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-white/10 bg-background/50 backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Film className="text-black" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-primary">CineTrack</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                location.pathname === item.path 
                  ? "bg-primary text-black font-semibold" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform duration-300 group-hover:scale-110",
                location.pathname === item.path ? "text-black" : "text-primary"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-2">
          {footerItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-sm",
                location.pathname === item.path 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              location.pathname === item.path ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};