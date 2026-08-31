"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface DangerZoneSectionProps {
  onLogout: () => void;
}

export const DangerZoneSection = ({ onLogout }: DangerZoneSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6 md:p-8 backdrop-blur-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
            <LogOut size={16} /> Sign Out Session
          </h3>
          <p className="text-xs text-muted-foreground">
            Safely disconnect your account from this browser and device.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-semibold text-xs rounded-xl transition-all duration-200"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </motion.section>
  );
};