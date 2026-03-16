"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { fetchContentDetails, ContentItem } from '@/lib/tmdb';
import { ContentCard } from '@/components/content/ContentCard';
import { Search, Filter, Loader2, Film, Tv, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';

const Collection = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: collectionData, error } = await supabase
          .from('collection')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch details in parallel for better performance
        const detailedItems = await Promise.all(
          (collectionData || []).map(async (item) => {
            try {
              return await fetchContentDetails(item.content_id, item.media_type);
            } catch (err) {
              console.error(`Failed to fetch details for ${item.content_id}`, err);
              return null;
            }
          })
        );

        setItems(detailedItems.filter((item): item is ContentItem => item !== null));
      } catch (error: any) {
        showError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, []);

  const handleRemove = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('collection')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', id);

    if (error) showError(error.message);
    else {
      setItems(prev => prev.filter(item => item.id !== id));
      showSuccess("Removed from collection");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || item.media_type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [items, searchQuery, filter]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1 p-4 lg:p-10 pb-24 lg:pb-10">
        <header className="mb-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold mb-2">My <span className="text-primary">Collection</span></h1>
              <p className="text-muted-foreground">Everything you've watched and loved.</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-black' : 'hover:bg-white/5'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('movie')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filter === 'movie' ? 'bg-primary text-black' : 'hover:bg-white/5'}`}
              >
                <Film size={14} /> Movies
              </button>
              <button 
                onClick={() => setFilter('tv')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filter === 'tv' ? 'bg-primary text-black' : 'hover:bg-white/5'}`}
              >
                <Tv size={14} /> Series
              </button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search your collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground font-medium">Loading your library...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  isWatched={true}
                  onToggleWatched={() => handleRemove(item.id)}
                  showWatchlistButton={false}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 glass-card border-dashed border-white/10">
            <LayoutGrid className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2">No items found</h3>
            <p className="text-muted-foreground">Start adding movies and series to your collection!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Collection;