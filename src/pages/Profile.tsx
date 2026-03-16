"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, LogOut, Edit3, Check, Loader2, Info, Mail, ChevronRight, Users, Lock } from 'lucide-react';
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

        <div className="space-y-6">
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
      </motion.main>
    </div>
  );
};

export default Profile;