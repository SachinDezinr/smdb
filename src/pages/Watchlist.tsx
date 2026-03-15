"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { ContentItem } from '@/lib/tmdb';
import { Bookmark, Loader2, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { showError, showSuccess } from '@/utils/toast';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { cn } from '@/lib/utils';

const Watchlist = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [watchlistRes, watchedRes] = await Promise.all([
      supabase.from('watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('watched_content').select('content_id').eq('user_id', user.id)
    ]);

    if (watchlistRes.data) {
      setItems(watchlistRes.data.map(item => ({
        id: item.content_id,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        media_type: item.media_type,
        genre_ids: [],
        overview: "",
        status: new Date(item.release_date) > new Date() ? "Upcoming" : "Released"
      })));
    }
    
    if (watchedRes.data) {
      setWatchedIds(watchedRes.data.map(i => i.content_id));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleWatchlist = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', item.id);

    if (error) {
      showError("Failed to remove from watchlist");
    } else {
      setItems(prev => prev.filter(i => i.id !== item.id));
      showSuccess("Removed from watchlist");
    }
  };

  const toggleWatched = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCurrentlyWatched = watchedIds.includes(item.id);

    if (isCurrentlyWatched) {
      await supabase.from('watched_content').delete().eq('user_id', user.id).eq('content_id', item.id);
      setWatchedIds(prev => prev.filter(id => id !== item.id));
      showSuccess("Removed from watched");
    } else {
      await supabase.from('watched_content').insert({
        user_id: user.id,
        content_id: item.id,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.media_type
      });
      setWatchedIds(prev => [...prev, item.id]);
      showSuccess("Marked as watched");
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.media_type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-background text-foreground"
    >
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold">
                My <span className="text-primary">Watchlist</span>
              </h1>
              <p className="text-muted-foreground mt-2">Content you're planning to watch</p>
            </div>
            
            <div className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search your watchlist..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {(['all', 'movie', 'tv'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all",
                  filter === f ? "bg-primary text-black" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ContentCard 
                key={item.id} 
                item={item} 
                isInWatchlist={true}
                isWatched={watchedIds.includes(item.id)}
                onToggleWatchlist={() => toggleWatchlist(item)}
                onToggleWatched={() => toggleWatched(item)}
                variant="watchlist"
                showWatchedButton={new Date(item.release_date) <= new Date()}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
              <Bookmark size={32} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your watchlist is empty</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">Start adding movies and shows you want to watch later!</p>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default Watchlist;