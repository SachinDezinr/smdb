"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { fetchUpcoming, fetchContent, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { Search, Loader2, Plus, X, Calendar as CalendarIcon, Sparkles, LayoutGrid, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { showError } from '@/utils/toast';
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

const Upcoming = () => {
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);

  const load = async (pageNum: number = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      let data: ContentItem[];
      const today = new Date().toISOString().split('T')[0];

      if (activeYear) {
        data = await fetchContent(activeCategory, activeYear, pageNum, "", activeRegion);
        data = data.filter(item => {
          if (!item.release_date || item.release_date === "TBA") return true;
          return item.release_date > today;
        });
        data.sort((a, b) => {
          if (a.release_date === "TBA") return 1;
          if (b.release_date === "TBA") return -1;
          return a.release_date.localeCompare(b.release_date);
        });
      } else {
        data = await fetchUpcoming(activeCategory, activeRegion, pageNum);
        data = data.filter(item => {
          if (!item.release_date || item.release_date === "TBA") return true;
          return item.release_date > today;
        });
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
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    if (!isSearching) load(1);
  }, [activeCategory, activeRegion, activeYear, isSearching]);

  const showRegionFilters = !isSearching && (activeCategory === 'movie' || activeCategory === 'tv');

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-7xl mx-auto w-full">
        <header className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                <CalendarIcon size={14} /> Premiere Schedule
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Upcoming <span className="text-primary">Releases</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Anticipated cinema and streaming drops slated for the near future.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative group flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search upcoming..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsSearching(false); }}
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
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setActiveCategory(cat.value); }}
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
                  <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
                  <button 
                    onClick={() => { setActiveYear(activeYear === 2027 ? null : 2027); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border",
                      activeYear === 2027 
                        ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/5 scale-[1.02]" 
                        : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.07]"
                    )}
                  >
                    <Sparkles size={13} className={activeYear === 2027 ? "text-primary" : "text-muted-foreground"} />
                    2027 Lineup
                  </button>
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

                <button 
                  onClick={() => { setActiveYear(activeYear === 2027 ? null : 2027); }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border",
                    activeYear === 2027 
                      ? "bg-primary/20 border-primary text-primary shadow-sm" 
                      : "bg-white/[0.04] border-white/10 text-white/80"
                  )}
                >
                  <Sparkles size={12} className={activeYear === 2027 ? "text-primary" : "text-muted-foreground"} />
                  2027
                </button>
              </div>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {(isSearching ? searchResults : items).map((item) => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  showReleaseDate 
                  showCategory={isSearching || activeYear === 2027}
                />
              ))}
            </div>
            
            {isSearching && searchResults.length === 0 && (
              <div className="text-center py-16 opacity-50 space-y-2">
                <p className="text-lg font-semibold">No upcoming results found</p>
                <p className="text-xs text-muted-foreground">Try another title or release keyword</p>
              </div>
            )}

            {!isSearching && items.length === 0 && (
              <div className="text-center py-24 opacity-50 flex flex-col items-center justify-center">
                <CalendarIcon size={48} className="mb-3 text-primary/30" />
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">No Announced Releases</h2>
                <p className="text-muted-foreground text-xs mt-1 max-w-sm">
                  {activeRegion !== 'all' 
                    ? `No ${activeRegion} content announced yet${activeYear ? ` for ${activeYear}` : ''}.` 
                    : `Nothing officially dated for this category yet${activeYear ? ` for ${activeYear}` : ''}.`}
                </p>
              </div>
            )}
            
            {!isSearching && items.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-7 py-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-all font-bold text-xs uppercase tracking-wider text-white border border-white/10 disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
                  Load More Releases
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