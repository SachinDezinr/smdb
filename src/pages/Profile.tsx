"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Shield, Edit3, Check, Loader2, Info, Mail, ChevronRight, Users, Lock, Bell } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUsername(user?.user_metadata?.username || '');
      
      if (user) {
        const { count } = await supabase
          .from('friends')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', user.id)
          .eq('status', 'pending');
        setPendingRequests(count || 0);
      }
    };
    init();
  }, []);

  const validateUsername = (name: string) => {
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    if (name.length < 3) return "Username too short";
    if (!regex.test(name)) return "Invalid characters or format";
    return null;
  };

  const handleUpdateUsername = async () => {
    const errorMsg = validateUsername(username);
    if (errorMsg) {
      showError(errorMsg);
      return;
    }

    setLoading(true);
    try {
      // Check if username is taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .neq('id', user.id)
        .single();

      if (existing) {
        showError("Username already taken");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: { username }
      });
      if (error) throw error;
      
      await supabase.from('profiles').update({ username }).eq('id', user.id);
      
      showSuccess("Username updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      showSuccess("Password updated successfully!");
      setNewPassword('');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!user) return null;

  const initial = (username || user.email || '?')[0].toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full">
        <header className="mb-12 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/40 cinematic-glow text-5xl font-serif font-bold text-primary">
              {initial}
            </div>
            {pendingRequests > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-background flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{pendingRequests}</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-primary text-black p-2 rounded-full shadow-lg">
              <Settings size={16} />
            </div>
          </div>
          <h1 className="text-4xl font-serif font-bold mb-2">{username || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </header>

        <div className="space-y-6">
          <section className="glass-card p-6 lg:p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <Edit3 size={20} className="text-primary" />
              Account Settings
            </h2>
            
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Username</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    disabled={!isEditing}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {isEditing ? (
                    <button
                      onClick={handleUpdateUsername}
                      disabled={loading}
                      className="bg-primary text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Allowed: a-z, 0-9, _, . (No symbols at start/end)</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Change Password</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={passLoading || !newPassword}
                    className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {passLoading ? <Loader2 className="animate-spin" size={18} /> : "Update"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card p-6 lg:p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Social Circle
            </h2>
            <Link to="/friends" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Users size={20} className="text-primary" />
                  {pendingRequests > 0 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
                </div>
                <span>Manage Friends & Requests</span>
              </div>
              <div className="flex items-center gap-2">
                {pendingRequests > 0 && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{pendingRequests} new</span>}
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
              </div>
            </Link>
          </section>

          <section className="glass-card p-6 lg:p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6">Support & Info</h2>
            <div className="space-y-2">
              <Link to="/about" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <Info size={20} className="text-primary" />
                  <span>About SMDB</span>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
              </Link>
              <Link to="/contact" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-primary" />
                  <span>Contact Support</span>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
              </Link>
            </div>
          </section>

          <section className="glass-card p-6 lg:p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <LogOut size={20} className="text-red-500" />
              Danger Zone
            </h2>
            <button
              onClick={handleLogout}
              className="w-full py-3 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors font-bold"
            >
              Sign Out of SMDB
            </button>
          </section>
        </div>

        <footer className="mt-12 text-center text-muted-foreground text-xs space-y-2">
          <p>© 2026 SMDB. All Rights Reserved.</p>
          <p className="max-w-xs mx-auto">Unauthorized copying of code, design, or content is strictly prohibited.</p>
        </footer>
      </main>
    </div>
  );
};

export default Profile;