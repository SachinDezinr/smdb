"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, LogOut, Edit3, Check, Loader2, Info, MessageSquare, ChevronRight, Users, ShieldCheck } from 'lucide-react';
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 p-4 lg:p-10 pb-24 lg:pb-10 max-w-2xl mx-auto w-full"
      >
        <header className="mb-8 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/40 cinematic-glow text-4xl font-serif font-bold text-primary">
              {(username || user.email || '?')[0].toUpperCase()}
            </div>
            {pendingCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                {pendingCount}
              </div>
            )}
          </div>
          
          <div className="space-y-1 mb-6">
            <h1 className="text-2xl font-serif font-bold truncate">{username || user.email}</h1>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>

          <div className="flex justify-center gap-3">
            {isEditing ? (
              <button onClick={updateUsername} disabled={loading} className="bg-primary text-black px-6 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Save Name
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="bg-white/10 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                <Edit3 size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </header>

        <div className="space-y-4">
          {/* Quick Actions */}
          <section className="glass-card p-4 border-white/5 space-y-3">
            <Link to="/friends" className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-primary" />
                <span className="text-sm font-bold">Friends & Requests</span>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>}
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </Link>

            {isEditing && (
              <div className="p-3 bg-white/5 rounded-xl space-y-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Change Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            )}

            <div className="p-3 bg-white/5 rounded-xl space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Update Password</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
                <button onClick={updatePassword} disabled={passLoading || !newPassword} className="bg-primary/10 text-primary px-4 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all">
                  {passLoading ? <Loader2 className="animate-spin" size={14} /> : "Update"}
                </button>
              </div>
            </div>
          </section>

          {/* Support Links */}
          <section className="grid grid-cols-2 gap-4">
            <Link to="/about" className="glass-card p-4 border-white/5 hover:bg-white/5 transition-colors text-center space-y-2">
              <Info size={20} className="text-primary mx-auto" />
              <p className="text-sm font-bold">About Us</p>
            </Link>
            <Link to="/contact" className="glass-card p-4 border-white/5 hover:bg-white/5 transition-colors text-center space-y-2">
              <MessageSquare size={20} className="text-primary mx-auto" />
              <p className="text-sm font-bold">Contact Us</p>
            </Link>
          </section>

          <button
            onClick={handleLogout}
            className="w-full py-3 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10 transition-all font-bold text-sm uppercase tracking-widest"
          >
            Sign Out
          </button>
        </div>
      </motion.main>
    </div>
  );
};

export default Profile;