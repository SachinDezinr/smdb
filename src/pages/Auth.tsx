"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Increased intensity of yellow glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/25 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/15 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 border-primary/20 cinematic-glow relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Film className="text-black" size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary">SMDB</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">
            {mode === 'login' ? "Sign in to track your journey" : 
             mode === 'register' ? "Create your cinematic profile" : 
             "Reset your password"}
          </p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleAuth} className="space-y-4">
            {(mode === 'register' || mode === 'forgot') && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 
               (mode === 'login' ? "Sign In" : mode === 'register' ? "Create Account" : "Verify & Reset")}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-center">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('register')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Don't have an account? Register
              </button>
              <button onClick={() => setMode('forgot')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Forgot Password?
              </button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> Back to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;