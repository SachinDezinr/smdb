"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Calendar, Film, Star, TrendingUp, X, PlayCircle, Tv, Sparkles, Heart, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Stats Page: Displays user's viewing habits and the "Yearly Wrapped" summary.
 */
const Stats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWrapped, setShowWrapped] = useState(false);
  const currentYear = new Date().getFullYear();

  // Fetches user statistics from Supabase
  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: watched } = await supabase
      .from('watched_content')
      .select('*')
      .eq('user_id', user.id);

    if (watched) {
      // Filter content released in the current year
      const yearWatched = watched.filter(i => {
        if (!i.release_date || i.release_date === "TBA") return false;
        return new Date(i.release_date).getFullYear() === currentYear;
      });
      
      // Categorize counts for different media types
      const counts = {
        movie: yearWatched.filter(i => i.media_type === 'movie').length,
        tv: yearWatched.filter(i => i.media_type === 'tv').length,
        anime: yearWatched.filter(i => i.media_type === 'anime').length,
        kdrama: yearWatched.filter(i => i.media_type === 'k-drama').length,
      };

      // Determine the most watched genre/category
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
        avgRating: (watched.reduce((acc, i) => acc + i.vote_average, 0) / (watched.length || 1)).toFixed(1),
        counts
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    
    // Real-time updates when collection changes
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
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold">
              Yearly <span className="text-primary">Wrapped</span>
            </h1>
            <p className="text-muted-foreground mt-2">Your cinematic journey in {currentYear}</p>
          </div>
          <button 
            onClick={() => setShowWrapped(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-xl hover:scale-105 transition-transform font-bold shadow-lg shadow-primary/20"
          >
            <Sparkles size={18} /> View My Wrapped
          </button>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: `Released in ${currentYear}`, value: stats?.yearTotal, icon: Calendar },
            { label: 'Top Category', value: stats?.topGenre, icon: Film, color: 'text-primary' },
            { label: 'Avg IMDb Rating', value: stats?.avgRating, icon: Star },
            { label: 'Total Lifetime', value: stats?.total, icon: Clock },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 border-white/5"
            >
              <item.icon className="text-primary mb-4" size={24} />
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
              <p className={cn("text-3xl font-bold", item.color)}>{item.value}</p>
            </motion.div>
          ))}
        </div>

        <section className="glass-card p-8 border-primary/10 cinematic-glow text-center py-20">
          <TrendingUp className="text-primary mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-serif font-bold mb-2">Keep Tracking!</h2>
          <p className="text-muted-foreground">Add more movies and series to see your detailed insights grow.</p>
        </section>

        {/* Wrapped Modal Overlay */}
        <AnimatePresence>
          {showWrapped && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-between border border-white/10 shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setShowWrapped(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50"
                >
                  <X size={20} />
                </button>

                <div className="text-center mt-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Film className="text-black" size={32} />
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-primary">SMDB</h3>
                  <p className="text-white/60 text-sm uppercase tracking-widest mt-2">Wrapped {currentYear}</p>
                </div>

                {/* Centered Count Section */}
                <div className="w-full flex flex-col items-center justify-center flex-1 py-4">
                  <div className="text-center flex flex-col items-center justify-center flex-1">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Titles Watched in {currentYear}</p>
                    <p className="text-8xl font-bold text-white leading-none tracking-tighter">{stats.yearTotal}</p>
                  </div>

                  {/* Category Grid */}
                  <div className="grid grid-cols-2 gap-4 w-full mt-auto">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <PlayCircle className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.counts.movie}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Movies</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Tv className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.counts.tv}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Series</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Sparkles className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.counts.anime}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Anime</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Heart className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.counts.kdrama}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">K-Drama</p>
                    </div>
                  </div>
                </div>

                <div className="w-full text-center pb-4">
                  <p className="text-white/40 text-xs italic">"Your cinematic journey, tracked."</p>
                  <p className="text-primary font-bold text-sm mt-2">smdb.app</p>
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