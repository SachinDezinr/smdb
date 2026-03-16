"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { ContentItem } from '@/lib/tmdb';
import { Bookmark, Loader2, Search } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Watchlist = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data.map(item => ({
        id: item.content_id,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        media_type: item.media_type as any,
        genre_ids: [],
        overview: "",
        status: new Date(item.release_date) > new Date() ? "Upcoming" : "Released"
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const removeFromWatchlist = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', id);

    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
      showSuccess("Removed from watchlist");
    }
  };

  const toggleWatched = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('watched_content')
      .insert({
        user_id: user.id,
        content_id: item.id,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        media_type: item.media_type
      });

    if (!error) {
      await removeFromWatchlist(item.id);
      showSuccess("Marked as watched!");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || item.media_type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [items, searchQuery, activeFilter]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 space-y-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold">
                My <span className="text-primary">Watchlist</span>
              </h1>
              <p className="text-muted-foreground mt-2">Content you've saved to watch later.</p>
            </div>

            <div className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search watchlist..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {['all', 'movie', 'tv', 'anime', 'k-drama'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all",
                  activeFilter === filter 
                    ? "bg-primary text-black" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </motion.header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card p-20 text-center border-dashed border-white/10">
            <Bookmark className="mx-auto text-muted-foreground mb-4 opacity-20" size={64} />
            <h2 className="text-2xl font-bold mb-2">Your watchlist is empty</h2>
            <Link to="/" className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform inline-block mt-4">
              Explore Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredItems.map((item) => {
              const isReleased = new Date(item.release_date) <= new Date();
              return (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  isInWatchlist={true}
                  showWatchedButton={isReleased}
                  onToggleWatched={() => toggleWatched(item)}
                  onToggleWatchlist={() => removeFromWatchlist(item.id)}
                  variant="watchlist"
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Watchlist;