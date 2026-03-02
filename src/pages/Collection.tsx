"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { Search, Library, Trash2, Loader2, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ContentItem } from '@/lib/tmdb';

const Collection = () => {
  const [watchedItems, setWatchedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWatched = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('watched_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setWatchedItems(data || []);
    setLoading(false);
  };

  const removeWatched = async (id: number) => {
    if (!confirm("Are you sure you want to remove this from your collection?")) return;

    const { error } = await supabase
      .from('watched_content')
      .delete()
      .eq('content_id', id);

    if (!error) {
      setWatchedItems(prev => prev.filter(item => item.content_id !== id));
    }
  };

  useEffect(() => {
    fetchWatched();
  }, []);

  const stats = {
    total: watchedItems.length,
    movies: watchedItems.filter(i => i.media_type === 'movie').length,
    tv: watchedItems.filter(i => i.media_type === 'tv').length,
    anime: watchedItems.filter(i => i.media_type === 'anime').length,
    kdrama: watchedItems.filter(i => i.media_type === 'k-drama').length,
  };

  const filteredItems = watchedItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold">
              Your <span className="text-primary">Collection</span>
            </h1>
            
            <div className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search your collection..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'primary' },
              { label: 'Movies', value: stats.movies, color: 'white' },
              { label: 'Series', value: stats.tv, color: 'white' },
              { label: 'Anime', value: stats.anime, color: 'white' },
              { label: 'K-Drama', value: stats.kdrama, color: 'white' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-4 text-center border-white/5"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color === 'primary' ? "text-primary" : "text-white")}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : watchedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
            <Library size={64} className="mb-4" />
            <h2 className="text-2xl font-serif">Your collection is empty</h2>
            <p>Start adding content from the Home tab</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.content_id} className="relative group">
                <ContentCard 
                  item={{
                    id: item.content_id,
                    title: item.title,
                    poster_path: item.poster_path,
                    release_date: item.release_date,
                    vote_average: item.vote_average,
                    media_type: item.media_type,
                    genre_ids: [],
                    overview: ""
                  }} 
                  isWatched={true}
                />
                <button
                  onClick={() => removeWatched(item.content_id)}
                  className="absolute top-2 left-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Collection;