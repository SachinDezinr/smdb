"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { fetchUpcoming, fetchContent, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { Search, Loader2, Filter, Plus, X, Calendar as CalendarIcon, LayoutGrid, ChevronDown } from 'lucide-react';
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
        // Strictly future releases for Upcoming
        data = data.filter(item => item.release_date > today);
      } else {
        data = await fetchUpcoming(activeCategory, activeRegion, pageNum);
        // Ensure strictly future releases even from the upcoming endpoint
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
      // Strictly future releases for search results in Upcoming page
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
            <div className="flex flex-wrap gap-3">
              {/* Category Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/10">
                    <LayoutGrid size={18} />
                    {CATEGORIES.find(c => c.value === activeCategory)?.label || 'Category'}
                    <ChevronDown size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-neutral-900 border-white/10 text-white min-w-[160px]">
                  {CATEGORIES.map((cat) => (
                    <DropdownMenuItem 
                      key={cat.value}
                      onClick={() => { setActiveCategory(cat.value); setActiveYear(null); setActiveRegion('all'); }}
                      className={cn(
                        "cursor-pointer focus:bg-primary focus:text-black font-medium",
                        activeCategory === cat.value && !activeYear && "bg-primary/20 text-primary"
                      )}
                    >
                      {cat.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem 
                    onClick={() => { setActiveYear(2027); }}
                    className={cn(
                      "cursor-pointer focus:bg-primary focus:text-black font-medium",
                      activeYear === 2027 && "bg-primary/20 text-primary"
                    )}
                  >
                    2027 Releases
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filter Dropdown */}
              {showRegionFilters && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all">
                      <Filter size={18} className="text-primary" />
                      {REGIONS.find(r => r.value === activeRegion)?.label || 'Filter'}
                      <ChevronDown size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-neutral-900 border-white/10 text-white min-w-[160px]">
                    {REGIONS
                      .filter(reg => reg.value !== 'korean' || activeYear === 2027)
                      .map((reg) => (
                        <DropdownMenuItem 
                          key={reg.value}
                          onClick={() => setActiveRegion(reg.value)}
                          className={cn(
                            "cursor-pointer focus:bg-primary focus:text-black font-medium",
                            activeRegion === reg.value && "bg-primary/20 text-primary"
                          )}
                        >
                          {reg.label}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                <ContentCard key={item.id} item={item} showReleaseDate />
              ))}
            </div>
            
            {isSearching && searchResults.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <p className="text-xl">No result found.</p>
              </div>
            )}

            {!isSearching && items.length === 0 && (
              <div className="text-center py-32 opacity-50 flex flex-col items-center justify-center">
                <CalendarIcon size={64} className="mb-4 text-primary/20" />
                <h2 className="text-2xl font-serif font-bold">No Upcoming Content</h2>
                <p className="text-muted-foreground mt-2">
                  {activeRegion !== 'all' 
                    ? `No ${activeRegion} content announced yet${activeYear ? ` for ${activeYear}` : ''}.` 
                    : `Nothing announced for this category yet${activeYear ? ` for ${activeYear}` : ''}.`}
                </p>
              </div>
            )}
            
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