"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { fetchUpcoming, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { Loader2, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

const CATEGORIES: { label: string; value: MediaType }[] = [
  { label: 'Movies', value: 'movie' },
  { label: 'Web Series', value: 'tv' },
  { label: 'Anime', value: 'anime' },
  { label: 'K-Drama', value: 'k-drama' },
];

const REGIONS: { label: string; value: Region }[] = [
  { label: 'All', value: 'all' },
  { label: 'Hollywood', value: 'hollywood' },
  { label: 'Bollywood', value: 'bollywood' },
  { label: 'International', value: 'international' },
];

const Upcoming = () => {
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  const fetchWatchedIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('watched_content').select('content_id').eq('user_id', user.id);
    if (data) setWatchedIds(data.map(item => item.content_id));
  };

  const loadContent = async (pageNum: number = 1) => {
    if (pageNum === 1) setLoading(true);
    try {
      const results = await fetchUpcoming(activeCategory, activeRegion, pageNum);
      if (results.length === 0) {
        setHasMore(false);
      } else {
        setContent(prev => pageNum === 1 ? results : [...prev, ...results]);
        setPage(pageNum);
      }
    } catch (error) {
      showError("Failed to load upcoming content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setContent([]);
    setHasMore(true);
    loadContent(1);
    fetchWatchedIds();
  }, [activeCategory, activeRegion]);

  const toggleWatched = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Please sign in to track movies");
      return;
    }

    const isCurrentlyWatched = watchedIds.includes(item.id);
    if (isCurrentlyWatched) {
      const { error } = await supabase.from('watched_content').delete().eq('user_id', user.id).eq('content_id', item.id);
      if (!error) {
        setWatchedIds(prev => prev.filter(id => id !== item.id));
        showSuccess("Removed from collection");
      }
    } else {
      const { error } = await supabase.from('watched_content').insert({
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
        showSuccess("Added to your collection!");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Calendar size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold">Upcoming Releases</h1>
              <p className="text-muted-foreground">Stay ahead of the curve with the most anticipated titles.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-semibold transition-all",
                    activeCategory === cat.value 
                      ? "bg-primary text-black" 
                      : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Filter size={16} className="text-primary mr-2" />
              {REGIONS.map((reg) => (
                <button
                  key={reg.value}
                  onClick={() => setActiveRegion(reg.value as Region)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                    activeRegion === reg.value 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-white/10 text-muted-foreground hover:border-white/30"
                  )}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-40 opacity-50">
            <p className="text-xl font-serif">No upcoming releases found for this category.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {content.map((item) => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  isWatched={watchedIds.includes(item.id)}
                  onToggleWatched={() => toggleWatched(item)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={() => loadContent(page + 1)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-bold text-sm border border-white/10"
                >
                  Load More Anticipated Titles
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Upcoming;