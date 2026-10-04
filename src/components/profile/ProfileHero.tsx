"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Target, 
  Sparkles, 
  Film, 
  Users, 
  UserCheck 
} from 'lucide-react';
import { getUserBadge } from '@/lib/badges';

interface ProfileHeroProps {
  user: any;
  username: string;
  joinedDate: string;
  watchedCount: number;
  friendsCount: number;
  pendingCount: number;
  onOpenBadgeModal: () => void;
}

export const ProfileHero = ({
  user,
  username,
  joinedDate,
  watchedCount,
  friendsCount,
  pendingCount,
  onOpenBadgeModal,
}: ProfileHeroProps) => {
  const initial = (username || user?.email || '?')[0].toUpperCase();
  const badgeInfo = getUserBadge(watchedCount);
  const CurrentIcon = badgeInfo.current.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/80 via-neutral-950/90 to-black p-6 md:p-8 mb-8 backdrop-blur-xl shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        {/* Avatar with Ring */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary/20 via-neutral-800 to-primary/40 border-2 border-primary/50 flex items-center justify-center text-4xl md:text-5xl font-bold text-primary shadow-xl shadow-primary/10">
            {initial}
          </div>
          <div
            className="absolute -bottom-2 -right-2 bg-neutral-900 border border-primary/40 p-1.5 rounded-xl shadow-md text-primary"
            title="Verified Cinephile"
          >
            <ShieldCheck size={16} />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left space-y-3 w-full">
          <div className="space-y-1.5">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {username || 'Anonymous User'}
              </h2>

              <button
                onClick={onOpenBadgeModal}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${badgeInfo.current.badgeStyle} shadow-sm flex-shrink-0 hover:scale-105 transition-transform cursor-pointer`}
                title="Click to view all badge tiers"
              >
                <CurrentIcon size={14} className={badgeInfo.current.iconColor} />
                {badgeInfo.current.label}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-primary/70" />
                {user?.email}
              </span>
              {joinedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary/70" />
                  Member since {joinedDate}
                </span>
              )}
            </div>
          </div>

          {/* Progress to Next Badge Tier */}
          {badgeInfo.next ? (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target size={12} className="text-primary" />
                  Next Rank: <strong className="text-white">{badgeInfo.next.label}</strong> ({badgeInfo.next.min} watches)
                </span>
                <span className="text-primary font-bold">{badgeInfo.neededForNext} more to level up</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${badgeInfo.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-gradient-to-r from-primary/80 to-primary h-full rounded-full"
                />
              </div>
            </div>
          ) : (
            <div className="pt-2 text-xs text-yellow-400 font-semibold flex items-center justify-center md:justify-start gap-1.5">
              <Sparkles size={14} /> Maximum Rank Achieved: Cinema Legend!
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5 max-w-lg mx-auto md:mx-0">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight">{watchedCount}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <Film size={11} className="text-primary" /> Watched
              </p>
            </div>
            <Link
              to="/friends"
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-3 text-center transition-colors group"
            >
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                {friendsCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <Users size={11} className="text-primary" /> Friends
              </p>
            </Link>
            <Link
              to="/friends"
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-3 text-center transition-colors relative group"
            >
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                {pendingCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <UserCheck size={11} className="text-primary" /> Requests
              </p>
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
};