"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, Loader2, Check, Film } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface UsernameSetupProps {
  onComplete: (username: string) => void;
}

export const UsernameSetup = ({ onComplete }: UsernameSetupProps) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    if (!usernameRegex.test(username)) {
      showError("Username must start/end with letters, and only contain letters, numbers, _ or .");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
      
      if (existing) throw new Error("Username already taken");

      const { error: authError } = await supabase.auth.updateUser({
        data: { username }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      showSuccess(`Welcome to SMDB, ${username}!`);
      onComplete(username);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-8 border-primary/20 cinematic-glow text-center"
      >
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
          <Film className="text-black" size={32} />
        </div>
        
        <h2 className="text-3xl font-serif font-bold mb-2">One Last Step!</h2>
        <p className="text-muted-foreground mb-8">Choose a unique username for your SMDB profile.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Enter username"
              required
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            Complete Setup
          </button>
        </form>
      </motion.div>
    </div>
  );
};