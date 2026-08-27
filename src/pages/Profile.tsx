"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { 
  Edit3, 
  Check, 
  Loader2, 
  Info, 
  Mail, 
  ChevronRight, 
  Users, 
  Lock, 
  LogOut, 
  Film, 
  ShieldCheck, 
  Sparkles, 
  Calendar,
  KeyRound,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);
  const [joinedDate, setJoinedDate] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPageLoading(false);
        return;
      }

      setUser(user);
      setUsername(user.user_metadata?.username || '');

      if (user.created_at) {
        const date = new Date(user.created_at);
        setJoinedDate(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }

      // Fetch pending friend requests
      const { data: pendingData } = await supabase
        .from('friends')
        .select('id')
        .eq('friend_id', user.id)
        .eq('status', 'pending');
      setPendingCount(pendingData?.length || 0);

      // Fetch accepted friends count
      const { data: friendsData } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      setFriendsCount(friendsData?.length || 0);

      // Fetch watched items count
      const { count: watchedTotal } = await supabase
        .from('watched_content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setWatchedCount(watchedTotal || 0);
      setPageLoading(false);
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    if (!usernameRegex.test(username)) {
      showError("Username must start/end with letters, and only contain letters, numbers, _ or .");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { username }
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
        password: newPassword
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) return null;

  const initial = (username || user.email || '?')[0].toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-5xl mx-auto w-full">
        {/* Page Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            <Sparkles size={14} /> Account & Preferences
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Settings & <span className="text-primary">Profile</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account credentials, social connections, and system preferences.
          </p>
        </header>

        {/* Profile Card Hero */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/80 via-neutral-950/90 to-black p-6 md:p-8 mb-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Avatar with Glow Ring */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary/20 via-neutral-800 to-primary/40 border-2 border-primary/50 flex items-center justify-center text-4xl md:text-5xl font-bold text-primary shadow-xl shadow-primary/10">
                {initial}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-neutral-900 border border-primary/40 p-1.5 rounded-xl shadow-md text-primary" title="Verified Cinephile">
                <ShieldCheck size={16} />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                      {username || 'Anonymous User'}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-primary/15 text-primary border border-primary/30">
                      Cinephile
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-primary/70" />
                      {user.email}
                    </span>
                    {joinedDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary/70" />
                        Member since {joinedDate}
                      </span>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5 max-w-lg mx-auto md:mx-0">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
                  <p className="text-xl md:text-2xl font-bold text-white tracking-tight">{watchedCount}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                    <Film size={11} className="text-primary" /> Watched
                  </p>
                </div>
                <Link to="/friends" className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-3 text-center transition-colors group">
                  <p className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">{friendsCount}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                    <Users size={11} className="text-primary" /> Friends
                  </p>
                </Link>
                <Link to="/friends" className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-3 text-center transition-colors relative group">
                  <p className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">{pendingCount}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                    <UserCheck size={11} className="text-primary" /> Requests
                  </p>
                  {pendingCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Setting Cards Grid */}
        <div className="space-y-6">

          {/* Section: Account & Profile Edit */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-neutral-950/70 p-6 md:p-8 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <UserCheck size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Personal Information</h3>
                <p className="text-xs text-muted-foreground">Manage your display username and public handle.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Used for friend searches and social comparisons.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered Email</label>
                  <input
                    type="email"
                    disabled
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 px-4 text-sm text-white/50 cursor-not-allowed"
                    value={user.email || ''}
                  />
                  <p className="text-[11px] text-muted-foreground">Contact support to change your account email.</p>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername(user.user_metadata?.username || '');
                      setIsEditing(false);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </motion.section>

          {/* Section: Security & Password */}
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
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-primary/60 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
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

          {/* Section: Shortcuts & Social Hub */}
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
                    <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Friends & Social Circle</h4>
                    <p className="text-xs text-muted-foreground">Compare collections and send friend requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white font-bold text-[10px] rounded-full animate-pulse">
                      {pendingCount} new
                    </span>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
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
                    <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">About SMDB</h4>
                    <p className="text-xs text-muted-foreground">Learn how the platform works and tracking tools</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
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
                    <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Contact Support & Developer</h4>
                    <p className="text-xs text-muted-foreground">Submit feedback, feature requests, or report issues</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </Link>
            </div>
          </motion.section>

          {/* Section: Danger Zone / Sign Out */}
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
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-semibold text-xs rounded-xl transition-all duration-200"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </motion.section>

        </div>
      </main>
    </div>
  );
};

export default Profile;