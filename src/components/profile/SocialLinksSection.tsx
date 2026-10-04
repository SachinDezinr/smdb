"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Info, MessageSquare, ChevronRight } from 'lucide-react';

interface SocialLinksSectionProps {
  pendingCount: number;
}

export const SocialLinksSection = ({ pendingCount }: SocialLinksSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 md:p-8 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <Users size={18} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Social & Quick Links</h3>
          <p className="text-xs text-muted-foreground">Manage your movie buddies and explore platform info.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link
          to="/friends"
          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                Friends & Social Circle
              </h4>
              <p className="text-xs text-muted-foreground">Compare collections and send friend requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white font-bold text-[10px] rounded-full animate-pulse">
                {pendingCount} new
              </span>
            )}
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all"
            />
          </div>
        </Link>

        <Link
          to="/about"
          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Info size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                About SMDB
              </h4>
              <p className="text-xs text-muted-foreground">Learn how the platform works and tracking tools</p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all"
          />
        </Link>

        <Link
          to="/contact"
          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-primary/30 transition-all group md:col-span-2"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <MessageSquare size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                Contact Support & Developer
              </h4>
              <p className="text-xs text-muted-foreground">Submit feedback, feature requests, or report issues</p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all"
          />
        </Link>
      </div>
    </motion.section>
  );
};