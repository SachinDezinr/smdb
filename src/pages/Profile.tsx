"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Shield, Edit3, Check, Loader2, Info, Mail, ChevronRight, Users } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUsername(user?.user_metadata?.username || '');
    };
    getUser();
  }, []);

  const handleUpdateUsername = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username }
      });
      if (error) throw error;
      showSuccess("Username updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full">
        <header className="mb-12 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 cinematic-glow">
              <User size={64} className="text-primary" />
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-black p-2 rounded-full shadow-lg">
              <Settings size={16} />
            </div>
          </div>
          <h1 className="text-4xl font-serif font-bold mb-2">{username || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </header>

        <div className="space-y-6">
          <section className="glass-card p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <Edit3 size={20} className="text-primary" />
              Account Settings
            </h2>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted-foreground">Username</label>
                <div className="flex gap-3">
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
                      className="bg-primary text-black px-6 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/10 text-white px-6 rounded-xl font-bold hover:bg-white/20 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Social Circle
            </h2>
            <Link to="/friends" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-primary" />
                <span>Manage Friends & Requests</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
          </section>

          <section className="glass-card p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6">Support & Info</h2>
            <div className="space-y-2">
              <Link to="/about" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <Info size={20} className="text-primary" />
                  <span>About CineTrack</span>
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

          <section className="glass-card p-8 border-white/5">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <LogOut size={20} className="text-red-500" />
              Danger Zone
            </h2>
            <button
              onClick={handleLogout}
              className="w-full py-3 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors font-bold"
            >
              Sign Out of CineTrack
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;