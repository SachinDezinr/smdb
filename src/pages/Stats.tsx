"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Calendar, Film, Star, TrendingUp, Download, Share2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

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
        const yearWatched = watched.filter(i => new Date(i.created_at).getFullYear() === currentYear);
        
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
          monthly: monthlyData
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, [currentYear]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My CineTrack Wrapped',
          text: `I watched ${stats.yearTotal} titles this year on CineTrack! My top category was ${stats.topGenre}.`,
          url: window.location.origin,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setShowWrapped(true);
    }
  };

  const handleDownload = () => {
    showSuccess("Ready for screenshot! Tip: Use your device's screenshot shortcut to save your Wrapped card.");
  };

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
          <div className="flex gap-3">
            <button 
              onClick={() => setShowWrapped(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-bold"
            >
              <Download size={18} /> Preview
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl hover:scale-105 transition-transform text-sm font-bold"
            >
              <Share2 size={18} /> Share
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Watched this Year', value: stats?.yearTotal, icon: Calendar },
            { label: 'Top Category', value: stats?.topGenre, icon: Film, color: 'text-primary' },
            { label: 'Avg IMDb Rating', value: stats?.avgRating, icon: Star },
            { label: 'Total Lifetime', value: stats?.total, icon: TrendingUp },
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
            Monthly Breakdown
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary/20 rounded-[2rem] p-8 flex flex-col items-center justify-between border border-white/10 shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setShowWrapped(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50"
                >
                  <X size={20} />
                </button>

                <div className="text-center mt-10">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Film className="text-black" size={32} />
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-primary">CineTrack</h3>
                  <p className="text-white/60 text-sm uppercase tracking-widest mt-2">Wrapped {currentYear}</p>
                </div>

                <div className="w-full space-y-8">
                  <div className="text-center">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-2">You Watched</p>
                    <p className="text-6xl font-bold text-white">{stats.yearTotal}</p>
                    <p className="text-primary font-bold mt-1">Titles this year</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Top Genre</p>
                      <p className="text-lg font-bold text-primary">{stats.topGenre}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Avg Rating</p>
                      <p className="text-lg font-bold text-white">{stats.avgRating}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full text-center pb-4">
                  <button 
                    onClick={handleDownload}
                    className="mb-4 px-6 py-2 bg-primary text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
                  >
                    Download Card
                  </button>
                  <p className="text-white/40 text-xs italic">"Your cinematic journey, tracked."</p>
                  <p className="text-primary font-bold text-sm mt-2">cinetrack.app</p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Stats;