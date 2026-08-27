"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Film, Star, TrendingUp, X, PlayCircle, Tv, Sparkles, Heart, Clock, Loader2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Stats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWrapped, setShowWrapped] = useState(false);
  const currentYear = new Date().getFullYear();

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: watched } = await supabase
      .from('watched_content')
      .select('*')
      .eq('user_id', user.id);

    if (watched) {
      const yearWatched = watched.filter(i => {
        if (!i.release_date || i.release_date === "TBA") return false;
        return new Date(i.release_date).getFullYear() === currentYear;
      });
      
      const counts = {
        movie: yearWatched.filter(i => i.media_type === 'movie').length,
        tv: yearWatched.filter(i => i.media_type === 'tv').length,
        anime: yearWatched.filter(i => i.media_type === 'anime').length,
        kdrama: yearWatched.filter(i => i.media_type === 'k-drama').length,
      };

      const genres: Record<string, number> = {};
      watched.forEach(i => {
        const g = i.media_type === 'tv' ? 'Web Series' : i.media_type.charAt(0).toUpperCase() + i.media_type.slice(1);
        genres[g] = (genres[g] || 0) + 1;
      });

      const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      setStats({
        total: watched.length,
        yearTotal: yearWatched.length,
        topGenre,
        avgRating: (watched.reduce((acc, i) => acc + (i.vote_average || 0), 0) / (watched.length || 1)).toFixed(1),
        counts
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    
    const channel = supabase
      .channel('stats_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watched_content' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentYear]);

  if (loading) return (
    <div className="flex min-h-screen bg-background items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-5xl mx-auto w-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              <BarChart3 size={14} /> Analytics & Habits
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Yearly <span className="text-primary">Wrapped</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Your cinematic milestones and taste summary in {currentYear}.</p>
          </div>
          <button 
            onClick={() => setShowWrapped(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black rounded-2xl hover:bg-primary/90 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles size={16} /> View My Wrapped
          </button>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: `Released in ${currentYear}`, value: stats?.yearTotal, icon: Calendar, color: 'text-white' },
            { label: 'Top Category', value: stats?.topGenre, icon: Film, color: 'text-primary' },
            { label: 'Avg IMDb Rating', value: stats?.avgRating, icon: Star, color: 'text-white' },
            { label: 'Total Lifetime', value: stats?.total, icon: Clock, color: 'text-white' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 border-white/10 rounded-2xl"
            >
              <item.icon className="text-primary mb-4" size={22} />
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">{item.label}</p>
              <p className={cn("text-3xl font-bold tracking-tight", item.color)}>{item.value}</p>
            </motion.div>
          ))}
        </div>

        <section className="glass-card p-8 border-primary/20 rounded-3xl cinematic-glow text-center py-16">
          <TrendingUp className="text-primary mx-auto mb-4" size={42} />
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Keep Tracking!</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Log movies, web series, anime, and dramas throughout the year to unlock deeper personalized stats and dynamic recommendations.
          </p>
        </section>

        {/* Wrapped Modal Overlay */}
        <AnimatePresence>
          {showWrapped && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-between border border-white/10 shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setShowWrapped(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50 text-white"
                >
                  <X size={18} />
                </button>

                <div className="text-center mt-6">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
                    <Film className="text-black" size={28} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-primary">SMDB</h3>
                  <p className="text-white/60 text-[11px] uppercase tracking-widest font-semibold mt-1">Wrapped {currentYear}</p>
                </div>

                {/* Centered Count Section */}
                <div className="w-full flex flex-col items-center justify-center flex-1 py-4">
                  <div className="text-center flex flex-col items-center justify-center flex-1">
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-2">Titles Watched in {currentYear}</p>
                    <p className="text-7xl font-bold text-white tracking-tighter">{stats.yearTotal}</p>
                  </div>

                  {/* Category Grid */}
                  <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                    <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                      <PlayCircle className="text-primary mb-1.5" size={18} />
                      <p className="text-xl font-bold text-white">{stats.counts.movie}</p>
                      <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Movies</p>
                    </div>
                    <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Tv className="text-primary mb-1.5" size={18} />
                      <p className="text-xl font-bold text-white">{stats.counts.tv}</p>
                      <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Series</p>
                    </div>
                    <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Sparkles className="text-primary mb-1.5" size={18} />
                      <p className="text-xl font-bold text-white">{stats.counts.anime}</p>
                      <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Anime</p>
                    </div>
                    <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Heart className="text-primary mb-1.5" size={18} />
                      <p className="text-xl font-bold text-white">{stats.counts.kdrama}</p>
                      <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">K-Drama</p>
                    </div>
                  </div>
                </div>

                <div className="w-full text-center pb-2">
                  <p className="text-white/40 text-[11px] italic font-medium">"Your cinematic journey, tracked."</p>
                  <p className="text-primary font-bold text-xs mt-1">smdb.app</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Stats;