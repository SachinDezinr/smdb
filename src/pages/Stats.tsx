"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Film, Star, TrendingUp, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Stats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        
        // Simple aggregation logic
        const genres: Record<string, number> = {};
        watched.forEach(i => {
          const g = i.media_type;
          genres[g] = (genres[g] || 0) + 1;
        });

        const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        setStats({
          total: watched.length,
          yearTotal: yearWatched.length,
          topGenre,
          avgRating: (watched.reduce((acc, i) => acc + i.vote_average, 0) / (watched.length || 1)).toFixed(1),
          monthly: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(0, i).toLocaleString('default', { month: 'short' }),
            count: yearWatched.filter(w => new Date(w.created_at).getMonth() === i).length
          }))
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
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-bold">
              <Download size={18} /> Download
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl hover:scale-105 transition-transform text-sm font-bold">
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
                    className="w-full bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-t-lg relative"
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
      </main>
    </div>
  );
};

export default Stats;