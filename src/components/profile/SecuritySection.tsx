"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

export const SecuritySection = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      showSuccess("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 md:p-8 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <KeyRound size={18} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Security & Password</h3>
          <p className="text-xs text-muted-foreground">Keep your SMDB credentials protected with a strong password.</p>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
                title={showNewPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors p-1"
                title={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={passLoading || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-primary hover:text-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-white/10 disabled:hover:text-white"
          >
            {passLoading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
            Update Password
          </button>
        </div>
      </form>
    </motion.section>
  );
};