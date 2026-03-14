"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { Bookmark, Loader2, Trash2, Plus, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';

const Watchlist = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWatchlist();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const removeFromWatchlist = async (id: number) => {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('content_id', id);

    if (!error) {
      setItems(prev => prev.filter(item => item.content_id !== id));
      showSuccess("Removed from watchlist");
    } else {
      showError("Failed to remove item");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold">
            Your <span className="text-primary">Watchlist</span>
          </h1>
          <p className="text-muted-foreground mt-2">Titles you're planning to experience soon.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
            <Bookmark size={64} className="mb-4" />
            <h2 className="text-2xl font-serif">Your watchlist is empty</h2>
            <p>Start exploring and save titles you want to watch later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {items.slice(0, visibleCount).map((item) => (
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
                  />
                  <button
                    onClick={() => removeFromWatchlist(item.content_id)}
                    className="absolute top-2 left-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {visibleCount < items.length && (
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
              className="fixed bottom-24 right-6 p-4 bg-primary text-black rounded-full shadow-2xl z-50 hover:scale-110 transition-transform"
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