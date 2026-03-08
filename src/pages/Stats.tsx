"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Calendar, Film, Star, TrendingUp, X, PlayCircle, Tv, Sparkles, Heart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const Stats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWrapped, setShowWrapped] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: watched } = await supabase
        .from('watched_content')
        .select('*')
        .eq('user_id', user.id);

      if (watched) {
        // Filter by release year as requested
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

        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const count = yearWatched.filter(w => new Date(w.created_at).getMonth() === i).length;
          return {
            month: new Date(0, i).toLocaleString('default', { month: 'short' }),
            count
          };
        });

        setStats({
          total: watched.length,
          yearTotal: yearWatched.length,
          topGenre,
          avgRating: (watched.reduce((acc, i) => acc + i.vote_average, 0) / (watched.length || 1)).toFixed(1),
          monthly: monthlyData,
          counts
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, [currentYear]);

  if (loading) return null;

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

        <section className="glass-card p-8 border-primary/10 cinematic-glow">
          <h2 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3">
            <BarChart3 className="text-primary" />
            Monthly Watch History ({currentYear} Releases)
          </h2>
          
          <div className="flex items-end justify-between h-64 gap-2">
            {stats?.monthly.map((m: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full relative h-full flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.count / (Math.max(...stats.monthly.map((x: any) => x.count)) || 1)) * 100}%` }}
                    className="w-full bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-t-lg relative min-h-[4px]"
                  >
                    {m.count > 0 && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.count}
                      </span>
                    )}
                  </motion.div>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">{m.month}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Wrapped Modal */}
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

                <div className="w-full space-y-8">
                  <div className="text-center">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Titles Released in {currentYear}</p>
                    <p className="text-6xl font-bold text-white">{stats.yearTotal}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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