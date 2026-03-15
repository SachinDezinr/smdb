"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, Calendar, LogOut, Loader2, Camera, Shield, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showSuccess("Signed out successfully");
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex min-h-screen bg-background text-foreground"
    >
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-serif font-bold">My <span className="text-primary">Profile</span></h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </header>

        <div className="space-y-8">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-4 border-primary/30">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-primary" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-primary text-black rounded-full shadow-lg hover:scale-110 transition-transform">
                  <Camera size={18} />
                </button>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-2xl font-bold">{user.user_metadata?.full_name || 'User'}</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-sm">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <button className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-bold">Security</h3>
                <p className="text-xs text-muted-foreground">Password and authentication</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-bold">Notifications</h3>
                <p className="text-xs text-muted-foreground">Manage your alerts</p>
              </div>
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </main>
    </motion.div>
  );
};

export default Profile;