"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, LogOut, Edit3, Check, Loader2, Info, Mail, ChevronRight, Users, Lock, ShieldCheck, MessageSquare } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUsername(user?.user_metadata?.username || '');
      
      if (user) {
        const { data } = await supabase
          .from('friends')
          .select('id')
          .eq('friend_id', user.id)
          .eq('status', 'pending');
        setPendingCount(data?.length || 0);
      }
    };
    getUser();
  }, []);

  const updateUsername = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { username }
    });
    if (error) showError(error.message);
    else {
      showSuccess("Username updated!");
      setIsEditing(false);
    }
    setLoading(false);
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) showError(error.message);
    else {
      showSuccess("Password updated!");
      setNewPassword('');
    }
    setPassLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 p-4 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full"
      >
        <header className="mb-12 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/40 cinematic-glow text-4xl lg:text-5xl font-serif font-bold text-primary">
              {(username || user.email || '?')[0].toUpperCase()}
            </div>
            {pendingCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                {pendingCount}
              </div>
            )}
          </div>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold mb-2 truncate px-4">{username || user.email}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </header>

        <div className="grid gap-6">
          {/* Account Settings */}
          <section className="glass-card p-6 lg:p-8 border-white/5 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <User size={20} className="text-primary" />
              <h2 className="text-xl font-serif font-bold">Account Settings</h2>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest">Username</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditing}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                {isEditing ? (
                  <button onClick={updateUsername} disabled={loading} className="bg-primary text-black px-6 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    Save
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-white/10 text-white px-6 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2">
                    <Edit3 size={18} />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest">Change Password</label>
              <div className="flex gap-3">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button onClick={updatePassword} disabled={passLoading || !newPassword} className="bg-white/10 text-white px-6 rounded-xl font-bold hover:bg-white/20 transition-all disabled:opacity-50">
                  {passLoading ? <Loader2 className="animate-spin" size={18} /> : "Update"}
                </button>
              </div>
            </div>
          </section>

          {/* Social & Support */}
          <section className="glass-card p-6 lg:p-8 border-white/5 space-y-4">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              Support & Info
            </h2>
            
            <Link to="/friends" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-primary" />
                <span className="font-bold">Friends & Requests</span>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>}
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
              </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
                <Info size={20} className="text-primary" />
                <div>
                  <p className="font-bold">About SMDB</p>
                  <p className="text-xs text-muted-foreground">Version 2.0.4</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
                <MessageSquare size={20} className="text-primary" />
                <div>
                  <p className="font-bold">Contact Us</p>
                  <p className="text-xs text-muted-foreground">Get help or give feedback</p>
                </div>
              </button>
            </div>
          </section>

          <button
            onClick={handleLogout}
            className="w-full py-4 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500/10 transition-all font-black uppercase tracking-widest"
          >
            Sign Out
          </button>
        </div>
      </motion.main>
    </div>
  );
};

export default Profile;