"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { fetchUpcoming, fetchContent, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { Search, Loader2, Filter, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/lib/supabase';

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
  { label: 'Punjabi', value: 'punjabi' },
  { label: 'South Indian', value: 'south-indian' },
  { label: 'Animated', value: 'animated' },
  { label: 'Korean', value: 'korean' },
];

const Upcoming = () => {
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);

  const fetchUserContent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [watchedRes, watchlistRes] = await Promise.all([
      supabase.from('watched_content').select('content_id').eq('user_id', user.id),
      supabase.from('watchlist').select('content_id').eq('user_id', user.id)
    ]);
    
    if (watchedRes.data) setWatchedIds(watchedRes.data.map(i => i.content_id));
    if (watchlistRes.data) setWatchlistIds(watchlistRes.data.map(i => i.content_id));
  };

  const load = async (pageNum: number = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      let data: ContentItem[];
      const today = new Date().toISOString().split('T')[0];

      if (activeYear) {
        data = await fetchContent(activeCategory, activeYear, pageNum, "", activeRegion);
        data = data.filter(item => item.release_date > today);
      } else {
        data = await fetchUpcoming(activeCategory, activeRegion, pageNum);
        data = data.filter(item => item.release_date > today);
      }
      
      setItems(prev => pageNum === 1 ? data : [...prev, ...data]);
      setPage(pageNum);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const toggleWatched = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
        if (watchlistIds.includes(item.id)) {
          await supabase.from('watchlist').delete().eq('user_id', user.id).eq('content_id', item.id);
          setWatchlistIds(prev => prev.filter(id => id !== item.id));
        }
        showSuccess("Marked as watched!");
      }
    }
  };

  const toggleWatchlist = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCurrentlyInWatchlist = watchlistIds.includes(item.id);

    if (isCurrentlyInWatchlist) {
      const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id).eq('content_id', item.id);
      if (!error) {
        setWatchlistIds(prev => prev.filter(id => id !== item.id));
        showSuccess("Removed from watchlist");
      }
    } else {
      const { error } = await supabase.from('watchlist').insert({
        user_id: user.id,
        content_id: item.id,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        media_type: item.media_type
      });
      if (!error) {
        setWatchlistIds(prev => [...prev, item.id]);
        showSuccess("Added to watchlist!");
      }
    }
  };

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      const results = await fetchContent('movie', undefined, 1, query, 'all');
      const today = new Date().toISOString().split('T')[0];
      setSearchResults(results.filter(item => item.release_date > today));
    } catch (error) {
      showError("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) performSearch(searchQuery);
      else setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    if (!isSearching) {
      load(1);
      fetchUserContent();
    }
  }, [activeCategory, activeRegion, activeYear, isSearching]);

  const showRegionFilters = !isSearching && (activeCategory === 'movie' || activeCategory === 'tv');

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold">
                Upcoming <span className="text-primary">Releases</span>
              </h1>
            </div>
            
            <div className="relative group max-w-md w-full flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search upcoming..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsSearching(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isSearching && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => { setActiveCategory(cat.value); setActiveYear(null); setActiveRegion('all'); }}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-semibold transition-all",
                      activeCategory === cat.value && !activeYear
                        ? "bg-primary text-black" 
                        : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
                <button
                  onClick={() => { 
                    const nextYear = activeYear === 2027 ? null : 2027;
                    setActiveYear(nextYear);
                  }}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 border",
                    activeYear === 2027 
                      ? "bg-primary border-primary text-black" 
                      : "bg-white/5 border-white/10 text-primary hover:bg-primary/10"
                  )}
                >
                  <CalendarIcon size={16} />
                  2027 Releases
                </button>
              </div>

              {showRegionFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Filter size={16} className="text-primary mr-2" />
                  {REGIONS
                    .filter(reg => reg.value !== 'korean' || activeYear === 2027)
                    .map((reg) => (
                      <button
                        key={reg.value}
                        onClick={() => setActiveRegion(reg.value)}
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
              )}
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {(isSearching ? searchResults : items).map((item) => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  isWatched={watchedIds.includes(item.id)}
                  isInWatchlist={watchlistIds.includes(item.id)}
                  onToggleWatched={() => toggleWatched(item)}
                  onToggleWatchlist={() => toggleWatchlist(item)}
                />
              ))}
            </div>
            
            {!isSearching && items.length > 0 && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-sm border border-white/10 disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  Load More Upcoming
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Upcoming;