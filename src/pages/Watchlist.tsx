"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { ContentItem } from '@/lib/tmdb';
import { Bookmark, Loader2, Search, X, Plus, ChevronUp } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { motion, AnimatePresence } from 'framer-motion';

const Watchlist = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchData = async () => {
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
        overview: ""
      })));
    }
    
    if (watchedRes.data) {
      setWatchedIds(watchedRes.data.map(item => item.content_id));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    } else {
      showError("Failed to remove item");
    }
  };

  const toggleWatched = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCurrentlyWatched = watchedIds.includes(item.id);

    if (isCurrentlyWatched) {
      const { error } = await supabase
        .from('watched_content')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', item.id);

      if (!error) {
        setWatchedIds(prev => prev.filter(id => id !== item.id));
        showSuccess("Removed from collection");
      }
    } else {
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
        setWatchedIds(prev => [...prev, item.id]);
        // Remove from watchlist since it's now watched
        await removeFromWatchlist(item.id);
        showSuccess("Marked as watched!");
      }
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const displayedItems = filteredItems.slice(0, visibleCount);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Bookmark className="text-primary" size={32} />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-serif font-bold">My Watchlist</h1>
                <p className="text-muted-foreground">Content you've saved to watch later.</p>
              </div>
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
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card p-20 text-center border-dashed border-white/10">
            <Bookmark className="mx-auto text-muted-foreground mb-4 opacity-20" size={64} />
            <h2 className="text-2xl font-bold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-8">Start adding movies and series you want to watch!</p>
            <a href="/" className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform inline-block">
              Explore Content
            </a>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <p className="text-xl">No items match your search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayedItems.map((item) => (
                <div key={item.id} className="relative group">
                  <ContentCard 
                    item={item} 
                    isWatched={watchedIds.includes(item.id)}
                    isInWatchlist={true}
                    onToggleWatched={() => toggleWatched(item)}
                    onToggleWatchlist={() => removeFromWatchlist(item.id)}
                  />
                </div>
              ))}
            </div>

            {visibleCount < filteredItems.length && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="flex items-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-sm border border-white/10"
                >
                  <Plus size={20} />
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-24 lg:bottom-10 right-6 p-4 bg-primary text-black rounded-full shadow-2xl z-50 hover:scale-110 transition-transform"
            >
              <ChevronUp size={24} />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Watchlist;