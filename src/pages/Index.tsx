"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from '@/components/layout/Navigation';
import { TrendingHero } from '@/components/content/TrendingHero';
import { CatalogFilters } from '@/components/content/CatalogFilters';
import { CatalogSearchResults } from '@/components/content/CatalogSearchResults';
import { YearSection } from '@/components/content/YearSection';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { fetchContent, ContentItem, MediaType, Region, getStartYear } from '@/lib/tmdb';
import { ContentItem, fetchContentByYear, fetchTopPickMovies, fetchTopPickShows, MediaType, isSeriesMediaType, getCachedTvSeason } from "@/lib/tmdb";
import { Search, Compass, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { getCatalogState, setCatalogState } from '@/lib/catalogStore';
import { addCollectionItem, removeCollectionItem } from '@/lib/collectionStore';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [highlightedYear, setHighlightedYear] = useState<number | null>(null);

  const prevFilters = useRef({ category: activeCategory, region: activeRegion });
  const isInitialMount = useRef(true);

  const currentYear = new Date().getFullYear();

  // Dynamically calculate available years based on category and region filter
  const years = useMemo(() => {
    const startYear = getStartYear(activeCategory, activeRegion);
    const count = Math.max(1, currentYear - startYear + 1);
    return Array.from({ length: count }, (_, i) => currentYear - i);
  }, [activeCategory, activeRegion, currentYear]);

  const fetchWatchedIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setWatchedIds([]);
      setCatalogState({ watchedIds: [] });
      return;
    }

    const { data } = await supabase
      .from('watched_content')
      .select('content_id')
      .eq('user_id', user.id);

    if (data) {
      const ids = data.map((item) => item.content_id);
      setWatchedIds(ids);
      setCatalogState({ watchedIds: ids });
    }
  };

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setIsSearching(false);
        setSearchResults([]);
        setCatalogState({ searchQuery: '' });
        return;
      }

      setIsSearching(true);
      setLoadingYears((prev) => ({ ...prev, 0: true }));
      try {
        const results = await fetchContent(activeCategory, undefined, 1, query, activeRegion);
        setSearchResults(results);
      } catch (error) {
        showError("Search failed. Please try again.");
      } finally {
        setLoadingYears((prev) => ({ ...prev, 0: false }));
      }
    },
    [activeCategory, activeRegion]
  );

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
    setLoadingYears((prev) => ({ ...prev, [year]: true }));
    try {
      const results = await fetchContent(activeCategory, year, page, "", activeRegion);

      setYearData((prev) => {
        const existing = prev[year] || [];
        const existingIds = new Set(existing.map((item) => item.id));
        const uniqueNew = results.filter((item) => !existingIds.has(item.id));
        const updated = {
          ...prev,
          [year]: page === 1 ? results : [...existing, ...uniqueNew],
        };
        setCatalogState({ yearData: updated });
        return updated;
      });

      setYearPages((prev) => {
        const updated = { ...prev, [year]: page };
        setCatalogState({ yearPages: updated });
        return updated;
      });
    } catch (error) {
      console.error(`Failed to fetch content for ${year}:`, error);
    } finally {
      setLoadingYears((prev) => ({ ...prev, [year]: false }));
    }
  };

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const isCurrentlyExpanded = prev.includes(year);
      let updated: number[];
      if (isCurrentlyExpanded) {
        // Closing via header click: highlight this year with no time limit
        updated = prev.filter((y) => y !== year);
        setHighlightedYear(year);
      } else {
        // Opening a year: remove previous closed highlight
        updated = [...prev, year];
        setHighlightedYear(null);
        if (!yearData[year]) {
          loadYearContent(year, 1);
        }
      }
      setCatalogState({ expandedYears: updated });
      return updated;
    });
  };

  const handleCloseYear = (year: number) => {
    setExpandedYears((prev) => {
      const updated = prev.filter((y) => y !== year);
      setCatalogState({ expandedYears: updated });
      return updated;
    });

    // Highlight closed year with no time limit until another year is opened
    setHighlightedYear(year);

    setTimeout(() => {
      const el = document.getElementById(`year-section-${year}`);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      }
    }, 50);
  };

  const toggleWatched = async (item: ContentItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // SOFT GATE: If logged out, redirect to /login with soft-gate parameters
    if (!user) {
      const currentPath = location.pathname + location.search;
      const params = new URLSearchParams({
        return_to: currentPath || '/',
        action: 'add_collection',
        movie_id: String(item.id),
        media_type: item.media_type || 'movie',
        title: item.title,
        poster_path: item.poster_path || '',
        release_date: item.release_date || '',
        vote_average: String(item.vote_average || 0),
      });

      navigate(`/login?${params.toString()}`);
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
        setWatchedIds((prev) => {
          const updated = prev.filter((id) => id !== item.id);
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
        season_count: item.season_count || (isSeriesMediaType(item.media_type) ? getCachedTvSeason(item.id) : undefined),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('watched_content').insert(newItem);

      if (!error) {
        setWatchedIds((prev) => {
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

    const filterChanged =
      prevFilters.current.category !== activeCategory ||
      prevFilters.current.region !== activeRegion;

    if (filterChanged || Object.keys(yearData).length === 0) {
      prevFilters.current = { category: activeCategory, region: activeRegion };
      if (!isSearching) {
        setYearData({});
        setYearPages({});
        setCatalogState({ yearData: {}, yearPages: {} });

        expandedYears.forEach((year) => {
          loadYearContent(year, 1);
        });
      }
    } else if (isInitialMount.current) {
      expandedYears.forEach((year) => {
        if (!yearData[year]) {
          loadYearContent(year, 1);
        }
      });
    }

    isInitialMount.current = false;
    fetchWatchedIds();
  }, [activeCategory, activeRegion, isSearching]);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      <ScrollToTop />

      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-7xl mx-auto w-full">
        {/* Header and Search Area */}
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
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                  size={18}
                />
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
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearching(false);
                      setCatalogState({ searchQuery: '' });
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isSearching && (
            <CatalogFilters
              activeCategory={activeCategory}
              activeRegion={activeRegion}
              onCategoryChange={setActiveCategory}
              onRegionChange={setActiveRegion}
            />
          )}
        </header>

        {/* Hero Section */}
        {!isSearching && <TrendingHero />}

        {/* Search Results or Year Accordions */}
        <div className="space-y-3">
          {isSearching ? (
            <CatalogSearchResults
              searchQuery={searchQuery}
              searchResults={searchResults}
              isLoading={!!loadingYears[0]}
              watchedIds={watchedIds}
              onToggleWatched={toggleWatched}
              onClearSearch={() => {
                setSearchQuery('');
                setIsSearching(false);
                setCatalogState({ searchQuery: '' });
              }}
            />
          ) : (
            years.map((year) => (
              <YearSection
                key={year}
                year={year}
                isExpanded={expandedYears.includes(year)}
                isHighlighted={highlightedYear === year}
                items={yearData[year]}
                isLoading={!!loadingYears[year]}
                watchedIds={watchedIds}
                onToggle={toggleYear}
                onLoadMore={(y) => loadYearContent(y, (yearPages[y] || 1) + 1)}
                onClose={handleCloseYear}
                onToggleWatched={toggleWatched}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;