"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { fetchUpcoming, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { Search, Loader2, Filter, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  { label: 'Punjabi', value: 'punjabi' },
  { label: 'South Indian', value: 'south-indian' },
  { label: 'Animated', value: 'animated' },
];

const Upcoming = () => {
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async (pageNum: number = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const data = await fetchUpcoming(activeCategory, activeRegion, pageNum);
      setItems(prev => pageNum === 1 ? data : [...prev, ...data]);
      setPage(pageNum);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [activeCategory, activeRegion]);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {!loading && (
                <p className="text-muted-foreground mt-2 font-medium">
                  Showing {items.length}+ anticipated titles
                </p>
              )}
            </div>
            
            <div className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search upcoming..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <ContentCard key={item.id} item={item} showReleaseDate />
              ))}
            </div>
            
            {items.length > 0 && (
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