"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { fetchContent, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { Search, ChevronDown, Loader2, Filter, Plus, X, Shield, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { label: 'Punjabi', value: 'punjabi' },
  { label: 'South Indian', value: 'south-indian' },
  { label: 'Animated', value: 'animated' },
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [expandedYears, setExpandedYears] = useState<number[]>([new Date().getFullYear()]);
  const [yearData, setYearData] = useState<Record<number, ContentItem[]>>({});
  const [yearPages, setYearPages] = useState<Record<number, number>>({});
  const [loadingYears, setLoadingYears] = useState<Record<number, boolean>>({});
  const [watchedIds, setWatchedIds] = useState<number[]>([]);
  const [adultFilter, setAdultFilter] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  const fetchWatchedIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('watched_content')
      .select('content_id')
      .eq('user_id', user.id);
    
    if (data) setWatchedIds(data.map(item => item.content_id));
  };

  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setLoadingYears({ 0: true });
    try {
      const results = await fetchContent(activeCategory, undefined, 1, searchQuery, activeRegion, adultFilter);
      setSearchResults(results);
    } catch (error) {
      showError("Search failed. Please try again.");
    } finally {
      setLoadingYears({ 0: false });
    }
  };

  const loadYearContent = async (year: number, page: number = 1) => {
    setLoadingYears(prev => ({ ...prev, [year]: true }));
    try {
      const results = await fetchContent(activeCategory, year, page, "", activeRegion, adultFilter);
      setYearData(prev => ({ 
        ...prev, 
        [year]: page === 1 ? results : [...(prev[year] || []), ...results] 
      }));
      setYearPages(prev => ({ ...prev, [year]: page }));
    } catch (error) {
      console.error(`Failed to fetch content for ${year}:`, error);
    } finally {
      setLoadingYears(prev => ({ ...prev, [year]: false }));
    }
  };

  const toggleYear = (year: number) => {
    if (expandedYears.includes(year)) {
      setExpandedYears(prev => prev.filter(y => y !== year));
    } else {
      setExpandedYears(prev => [...prev, year]);
      if (!yearData[year]) loadYearContent(year, 1);
    }
  };

  const toggleWatched = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Please sign in to track movies");
      return;
    }

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
        showSuccess("Added to your collection!");
      }
    }
  };

  useEffect(() => {
    if (!isSearching) {
      setYearData({});
      setYearPages({});
      setExpandedYears([currentYear]);
      loadYearContent(currentYear, 1);
    }
    fetchWatchedIds();
  }, [activeCategory, activeRegion, isSearching, adultFilter]);

  const showRegionFilters = activeCategory !== 'anime' && activeCategory !== 'k-drama';

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold">
              Discover <span className="text-primary">Cinema</span>
            </h1>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <form onSubmit={handleGlobalSearch} className="relative group flex-1 lg:w-80 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Search globally..."
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
                <button 
                  type="submit"
                  className="bg-primary text-black px-6 rounded-2xl font-bold hover:scale-105 transition-transform"
                >
                  Search
                </button>
              </form>

              <button
                onClick={() => setAdultFilter(!adultFilter)}
                className={cn(
                  "p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs",
                  adultFilter 
                    ? "bg-red-500/10 border-red-500 text-red-500" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
                )}
                title={adultFilter ? "Adult Filter ON" : "Adult Filter OFF"}
              >
                {adultFilter ? <Shield size={18} /> : <ShieldOff size={18} />}
                <span className="hidden md:inline">18+</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {!isSearching && (
              <>
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

                {showRegionFilters && (
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
                )}
              </>
            )}
          </div>
        </header>

        <div className="space-y-4">
          {isSearching ? (
            <div className="glass-card p-8 border-primary/20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold">Search Results for "{searchQuery}"</h2>
                <button 
                  onClick={() => setIsSearching(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Years
                </button>
              </div>
              
              {loadingYears[0] ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-primary" size={48} />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <p className="text-xl">No results found for your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {searchResults.map((item) => (
                    <ContentCard 
                      key={item.id} 
                      item={item} 
                      isWatched={watchedIds.includes(item.id)}
                      onToggleWatched={() => toggleWatched(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            years.map((year) => (
              <div key={year} className="glass-card overflow-hidden border-white/5">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-serif font-bold text-primary">{year}</span>
                    <span className="text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                      {yearData[year] ? `${yearData[year].length}+ Items` : "Loading..."}
                    </span>
                  </div>
                  <ChevronDown 
                    className={cn("transition-transform duration-300", expandedYears.includes(year) && "rotate-180")} 
                    size={24} 
                  />
                </button>

                <AnimatePresence>
                  {expandedYears.includes(year) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6 pt-0">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          {yearData[year]?.map((item) => (
                            <ContentCard 
                              key={item.id} 
                              item={item} 
                              isWatched={watchedIds.includes(item.id)}
                              onToggleWatched={() => toggleWatched(item)}
                            />
                          ))}
                        </div>

                        {loadingYears[year] ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="animate-spin text-primary" size={32} />
                          </div>
                        ) : (
                          yearData[year] && yearData[year].length > 0 && (
                            <div className="mt-8 flex justify-center">
                              <button
                                onClick={() => loadYearContent(year, (yearPages[year] || 1) + 1)}
                                className="flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all font-bold text-sm border border-white/10"
                              >
                                <Plus size={18} />
                                Load More
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>

        <footer className="mt-20 py-10 border-t border-white/5 text-center text-muted-foreground text-xs space-y-2">
          <p>© 2026 SMDB. All Rights Reserved.</p>
          <p>Unauthorized copying of code, design, or content is strictly prohibited.</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;