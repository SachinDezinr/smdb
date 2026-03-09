"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Shield, Edit3, Check, Loader2, Info, Mail, ChevronRight, Users, Lock, HelpCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
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
      setSecurityAnswer(user?.user_metadata?.security_answer || '');
      
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

  const handleUpdateProfile = async () => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    if (!usernameRegex.test(username)) {
      showError("Username must start/end with letters, and only contain letters, numbers, _ or .");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          username,
          security_answer: securityAnswer.toLowerCase().trim()
        }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      showSuccess("Profile updated successfully!");
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
  const hasSecurityAnswer = !!user?.user_metadata?.security_answer;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-4 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full">
        <header className="mb-12 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/40 cinematic-glow text-4xl lg:text-5xl font-serif font-bold text-primary">
              {initial}
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

        <div className="space-y-6">
          <section className="glass-card p-6 lg:p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <Edit3 size={20} className="text-primary" />
              Account Settings
            </h2>
            
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Username</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {!hasSecurityAnswer && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <HelpCircle size={14} /> Security Question Answer
                  </label>
                  <p className="text-xs text-muted-foreground mb-1">Question: What is your favourite movie/series?</p>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Your Answer"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                  />
                </div>
              )}

              {hasSecurityAnswer && (
                <div className="flex items-center gap-2 text-xs text-primary font-bold bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <Shield size={14} />
                  Security Question Configured
                </div>
              )}

              <div className="flex justify-end">
                {isEditing ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 rounded-xl font-bold text-white/60 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="pt-8 border-t border-white/5">
                <label className="text-sm text-muted-foreground block mb-2">Change Password</label>
                <div className="flex flex-col sm:flex-row gap-3">
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
                <Users size={20} className="text-primary" />
                <span>Manage Friends & Requests</span>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>}
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
              </div>
            </Link>
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
      </main>
    </div>
  );
};

export default Profile;