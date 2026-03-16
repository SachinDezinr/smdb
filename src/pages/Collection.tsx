"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { fetchContentDetails, ContentItem } from '@/lib/tmdb';
import { ContentCard } from '@/components/content/ContentCard';
import { Loader2, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';

const Collection = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Keep the parallel fetching for speed, but remove the extra UI elements
        const detailedItems = await Promise.all(
          (collectionData || []).map(async (item) => {
            try {
              return await fetchContentDetails(item.content_id, item.media_type);
            } catch (err) {
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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1 p-4 lg:p-10 pb-24 lg:pb-10">
        <header className="mb-10">
          <h1 className="text-4xl font-serif font-bold mb-2">My <span className="text-primary">Collection</span></h1>
          <p className="text-muted-foreground">Your personal library of movies and shows.</p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground font-medium">Loading your library...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
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