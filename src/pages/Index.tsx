"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { TrendingHero } from '@/components/content/TrendingHero';
import { fetchContent, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { Search, ChevronDown, Loader2, Filter, Plus, X, LayoutGrid, Compass, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { getCatalogState, setCatalogState } from '@/lib/catalogStore';
import { addCollectionItem, removeCollectionItem } from '@/lib/collectionStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIES: { label: string; value: MediaType }[] = [
  { label: 'Movies', value: 'movie' },
  { label: 'Web Series', value: 'tv' },
  { label: 'Anime', value: 'anime' },
  { label: 'K-Drama', value: 'k-drama' },
];

const REGIONS: { label: string; value: Region }[] = [
  { label: 'All Regions', value: 'all' },
  { label: 'Hollywood', value: 'hollywood' },
  { label: 'Bollywood', value: 'bollywood' },
  { label: 'Pollywood', value: 'punjabi' },
  { label: 'Tollywood', value: 'south-indian' },
  { label: 'Animated', value: 'animated' },
];

const Index = () => {
  const initialStore = getCatalogState();
  const [activeCategory, setActiveCategory] = useState<MediaType>(initialStore.activeCategory);
  const [activeRegion, setActiveRegion] = useState<Region>(initialStore.activeRegion);
  const [searchQuery, setSearchQuery] = useState(initialStore.searchQuery);
  const [isSearching, setIsSearching] = useState(!!initialStore.searchQuery);
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [expandedYears, setExpandedYears] = useState<number[]>(initialStore.expandedYears);
  const [yearData, setYearData] = useState<Record<number, ContentItem[]>>(initialStore.yearData);
  const [yearPages, setYearPages] = useState<Record<number, number>>(initialStore.yearPages);
  const [loadingYears, setLoadingYears] = useState<Record<number, boolean>>({});
  const [watchedIds, setWatchedIds] = useState<number[]>(initialStore.watchedIds);

  const prevFilters = useRef({ category: activeCategory, region: activeRegion });
  const isInitialMount = useRef(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

  const fetchWatchedIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('watched_content')
      .select('content_id')
      .eq('user_id', user.id);
    
    if (data) {
      const ids = data.map(item => item.content_id);
      setWatchedIds(ids);
      setCatalogState({ watchedIds: ids });
    }
  };

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      setCatalogState({ searchQuery: '' });
      return;
    }

    setIsSearching(true);
    setLoadingYears(prev => ({ ...prev, 0: true }));
    try {
      const results = await fetchContent(activeCategory, undefined, 1, query, activeRegion);
      setSearchResults(results);
    } catch (error) {
      showError("Search failed. Please try again.");
    } finally {
      setLoadingYears(prev => ({ ...prev, 0: false }));
    }
  }, [activeCategory, activeRegion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCatalogState({ searchQuery });
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const loadYearContent = async (year: number, page: number = 1) => {
    setLoadingYears(prev => ({ ...prev, [year]: true }));
    try {
      const results = await fetchContent(activeCategory, year, page, "", activeRegion);
      
      setYearData(prev => {
        const existing = prev[year] || [];
        const existingIds = new Set(existing.map(item => item.id));
        const uniqueNew = results.filter(item => !existingIds.has(item.id));
        const updated = { 
          ...prev, 
          [year]: page === 1 ? results : [...existing, ...uniqueNew] 
        };
        setCatalogState({ yearData: updated });
        return updated;
      });

      setYearPages(prev => {
        const updated = { ...prev, [year]: page };
        setCatalogState({ yearPages: updated });
        return updated;
      });
    } catch (error) {
      console.error(`Failed to fetch content for ${year}:`, error);
    } finally {
      setLoadingYears(prev => ({ ...prev, [year]: false }));
    }
  };

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      let updated: number[];
      if (prev.includes(year)) {
        updated = prev.filter(y => y !== year);
      } else {
        updated = [...prev, year];
        if (!yearData[year]) {
          loadYearContent(year, 1);
        }
      }
      setCatalogState({ expandedYears: updated });
      return updated;
    });
  };

  const handleCloseYear = (year: number) => {
    setExpandedYears(prev => {
      const updated = prev.filter(y => y !== year);
      setCatalogState({ expandedYears: updated });
      return updated;
    });

    // Scroll smoothly to that particular year section bar
    setTimeout(() => {
      const targetElement = document.getElementById(`year-section-${year}`);
      if (targetElement) {
        const offset = 90;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = targetElement.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 50);
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
        setWatchedIds(prev => {
          const updated = prev.filter(id => id !== item.id);
          setCatalogState({ watchedIds: updated });
          return updated;
        });
        removeCollectionItem(item.id);
        showSuccess("Removed from collection");
      }
    } else {
      const newItem = {
        user_id: user.id,
        content_id: item.id,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        media_type: item.media_type,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('watched_content')
        .insert(newItem);

      if (!error) {
        setWatchedIds(prev => {
          const updated = [...prev, item.id];
          setCatalogState({ watchedIds: updated });
          return updated;
        });
        addCollectionItem(newItem);
        showSuccess("Added to your collection!");
      }
    }
  };

  useEffect(() => {
    setCatalogState({ activeCategory, activeRegion });

    const filterChanged = prevFilters.current.category !== activeCategory || prevFilters.current.region !== activeRegion;

    if (filterChanged || Object.keys(yearData).length === 0) {
      prevFilters.current = { category: activeCategory, region: activeRegion };
      if (!isSearching) {
        setYearData({});
        setYearPages({});
        setCatalogState({ yearData: {}, yearPages: {} });
        
        expandedYears.forEach(year => {
          loadYearContent(year, 1);
        });
      }
    } else if (isInitialMount.current) {
      expandedYears.forEach(year => {
        if (!yearData[year]) {
          loadYearContent(year, 1);
        }
      });
    }

    isInitialMount.current = false;
    fetchWatchedIds();
  }, [activeCategory, activeRegion, isSearching]);

  const showRegionFilters = !isSearching && activeCategory !== 'anime' && activeCategory !== 'k-drama';

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-7xl mx-auto w-full">
        <header className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                <Compass size={14} /> Cinema Catalog
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Discover <span className="text-primary">SMDB</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Explore movies, series, and anime categorized by release year.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative group flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsSearching(false); setCatalogState({ searchQuery: '' }); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isSearching && (
            <div className="space-y-2.5">
              {/* Desktop Controls - Centered */}
              <div className="hidden lg:flex flex-col gap-2 items-center justify-center">
                <div className="flex flex-wrap gap-2 justify-center items-center">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border",
                        activeCategory === cat.value 
                          ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-[1.02]" 
                          : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.07] hover:text-white"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {showRegionFilters && (
                  <div className="flex flex-wrap gap-1.5 justify-center items-center">
                    {REGIONS.map((reg) => (
                      <button
                        key={reg.value}
                        onClick={() => setActiveRegion(reg.value)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl font-semibold text-[11px] tracking-wide transition-all border",
                          activeRegion === reg.value 
                            ? "bg-white/15 border-primary/60 text-primary shadow-sm" 
                            : "bg-white/[0.02] border-white/5 text-muted-foreground hover:text-white"
                        )}
                      >
                        {reg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Controls - Centered & Compact */}
              <div className="lg:hidden flex flex-wrap gap-2 justify-center items-center pt-0.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-black rounded-xl font-bold text-xs uppercase tracking-wider shadow-md">
                      <LayoutGrid size={14} />
                      {CATEGORIES.find(c => c.value === activeCategory)?.label}
                      <ChevronDown size={12} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-neutral-950 border-white/10 text-white">
                    {CATEGORIES.map((cat) => (
                      <DropdownMenuItem key={cat.value} onClick={() => setActiveCategory(cat.value)} className="text-xs font-semibold py-2">
                        {cat.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {showRegionFilters && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl font-semibold text-xs tracking-wide">
                        <Filter size={13} className="text-primary" />
                        {REGIONS.find(r => r.value === activeRegion)?.label}
                        <ChevronDown size={12} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-950 border-white/10 text-white">
                      {REGIONS.map((reg) => (
                        <DropdownMenuItem key={reg.value} onClick={() => setActiveRegion(reg.value)} className="text-xs font-semibold py-2">
                          {reg.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
        </header>

        {!isSearching && <TrendingHero />}

        <div className="space-y-3">
          {isSearching ? (
            <div className="glass-card p-5 md:p-7 border-primary/20 rounded-2xl md:rounded-3xl">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Query</span>
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Results for "{searchQuery}"</h2>
                </div>
                <button 
                  onClick={() => { setSearchQuery(''); setIsSearching(false); setCatalogState({ searchQuery: '' }); }}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Clear Search
                </button>
              </div>
              
              {loadingYears[0] ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-primary" size={40} />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-16 opacity-50 space-y-2">
                  <p className="text-lg font-semibold">No results found</p>
                  <p className="text-xs text-muted-foreground">Try a different spelling or search keyword</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {searchResults.map((item) => (
                    <ContentCard 
                      key={item.id} 
                      item={item} 
                      isWatched={watchedIds.includes(item.id)}
                      onToggleWatched={() => toggleWatched(item)}
                      showCategory={true}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            years.map((year) => (
              <div 
                key={year} 
                id={`year-section-${year}`} 
                className="glass-card overflow-hidden border-white/10 rounded-2xl transition-all scroll-mt-24"
              >
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-xl md:text-3xl font-bold tracking-tight text-primary">{year}</span>
                    <span className="text-[11px] md:text-xs font-semibold text-muted-foreground bg-white/[0.04] border border-white/5 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full">
                      {yearData[year] ? `${yearData[year].length}+ Titles` : "Loading..."}
                    </span>
                  </div>
                  <ChevronDown 
                    className={cn("transition-transform duration-300 text-muted-foreground", expandedYears.includes(year) && "rotate-180 text-primary")} 
                    size={18} 
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
                      <div className="p-4 md:p-6 pt-0">
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-primary" size={28} />
                          </div>
                        ) : (
                          yearData[year] && yearData[year].length > 0 && (
                            <div className="mt-6 flex items-center justify-center gap-3">
                              <button
                                onClick={() => loadYearContent(year, (yearPages[year] || 1) + 1)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-all font-bold text-xs uppercase tracking-wider text-white border border-white/10"
                              >
                                <Plus size={15} />
                                Load More for {year}
                              </button>
                              <button
                                onClick={() => handleCloseYear(year)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] hover:border-red-500/30 hover:text-red-400 rounded-xl transition-all font-bold text-xs uppercase tracking-wider text-muted-foreground border border-white/10"
                                title={`Close ${year}`}
                              >
                                <ChevronUp size={15} />
                                Close {year}
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
      </main>
    </div>
  );
};

export default Index;