"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Mail, Lock, User, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const validateUsername = (name: string) => {
    const regex = /^[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    return regex.test(name);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showSuccess("Welcome back to SMDB!");
        navigate('/');
      } else if (mode === 'register') {
        if (!validateUsername(username)) {
          throw new Error("Username must start/end with letters, and only contain letters, numbers, _ or .");
        }

        const { data: existing } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();
        
        if (existing) throw new Error("Username already taken");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { username } 
          }
        });
        if (error) throw error;
        
        showSuccess("Registration successful! Please check your email for confirmation.");
        setMode('login');
      } else if (mode === 'forgot') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .eq('username', username)
          .single();
        
        if (profileError || !profile) {
          throw new Error("Account details do not match our records.");
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/profile`,
        });
        if (error) throw error;
        showSuccess("Details verified! A reset link has been sent to your email.");
        setMode('login');
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 border-primary/20 rounded-3xl cinematic-glow relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          {/* Logo with subtle gradient, gentle ambient glow, and refined border */}
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 via-primary/10 to-amber-200/20 rounded-2xl blur-sm opacity-80" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#FFE799] via-primary to-[#D69E0A] rounded-2xl flex items-center justify-center shadow-xl shadow-primary/25 border border-white/20">
              <Film className="text-black/90 drop-shadow-sm" size={30} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            <Sparkles size={11} /> Cinematic Journey Tracker
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            SMDB
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            {mode === 'login' ? "Sign in to track your watch history" : 
             mode === 'register' ? "Create your personalized cinephile vault" : 
             "Recover and reset your password"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-3.5">
          {(mode === 'register' || mode === 'forgot') && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={17} />
              <input
                type="text"
                placeholder="Username"
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={17} />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={17} />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 
             (mode === 'login' ? "Sign In" : mode === 'register' ? "Create Account" : "Verify & Reset")}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2.5 text-center">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('register')} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Don't have an account? <span className="font-semibold text-white">Register</span>
              </button>
              <button onClick={() => setMode('forgot')} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Forgot Password?
              </button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5">
              <ArrowLeft size={13} /> Back to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;