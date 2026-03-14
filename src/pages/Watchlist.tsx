"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { ContentItem } from '@/lib/tmdb';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

const Watchlist = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Bookmark className="text-primary" size={32} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold">My Watchlist</h1>
          </div>
          <p className="text-muted-foreground">Content you've saved to watch later.</p>
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
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {items.map((item) => (
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
        )}
      </main>
    </div>
  );
};

export default Watchlist;