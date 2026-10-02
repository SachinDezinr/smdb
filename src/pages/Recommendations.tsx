import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentItem } from '@/lib/tmdb/types';
import { fetchBestOfYear } from '@/lib/tmdb/queries';
import { MOVIE_GENRES, TV_GENRES, COMMON_GENRES, GenreOption } from '@/lib/tmdb/genres';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import {
  Sparkles,
  Award,
  Film,
  Tv,
  Layers,
  Calendar,
  ChevronDown,
  Loader2,
  Globe,
  SlidersHorizontal,
  Flame,
  Star,
  Clapperboard,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type RecommendationCategory = 'all' | 'movie' | 'tv' | 'kdrama' | 'anime';
export type RecommendationRegion = 'all' | 'hollywood' | 'bollywood' | 'pollywood' | 'tollywood';

// Strictly from 2026 down to 1950 (new to old)
const ALL_YEARS: number[] = [];
for (let y = 2026; y >= 1950; y--) {
  ALL_YEARS.push(y);
}

const BATCH_SIZE = 12;

const REGION_OPTIONS: { id: RecommendationRegion; label: string; flag: string }[] = [
  { id: 'all', label: 'All Industries', flag: '🌐' },
  { id: 'hollywood', label: 'Hollywood (English)', flag: '🇺🇸' },
  { id: 'bollywood', label: 'Bollywood (Hindi)', flag: '🇮🇳' },
  { id: 'tollywood', label: 'Tollywood (Telugu)', flag: '🇮🇳' },
  { id: 'pollywood', label: 'Pollywood (Punjabi)', flag: '🇮🇳' },
];

export default function Recommendations() {
  const [category, setCategory] = useState<RecommendationCategory>('all');
  const [selectedGenre, setSelectedGenre] = useState<number | string>('all');
  const [region, setRegion] = useState<RecommendationRegion>('all');

  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const [yearData, setYearData] = useState<Record<number, ContentItem | null>>({});
  const [loadingYears, setLoadingYears] = useState<Record<number, boolean>>({});

  // Determine available genres based on active category
  const availableGenres = useMemo<GenreOption[]>(() => {
    if (category === 'movie') return MOVIE_GENRES;
    if (category === 'tv' || category === 'kdrama') return TV_GENRES;
    return COMMON_GENRES;
  }, [category]);

  // If active genre doesn't exist in current category, reset to 'all'
  useEffect(() => {
    if (selectedGenre !== 'all' && !availableGenres.some((g) => String(g.id) === String(selectedGenre))) {
      setSelectedGenre('all');
    }
  }, [category, availableGenres, selectedGenre]);

  // Can show region filters only for movie, series, and all (not applicable to kdrama/anime which are inherently Korean / Japanese)
  const showRegionFilter = category === 'movie' || category === 'tv' || category === 'all';

  // Visible slice of years
  const visibleYears = useMemo(() => {
    return ALL_YEARS.slice(0, visibleCount);
  }, [visibleCount]);

  // Fetch best item for a given year
  const loadYear = useCallback(
    async (
      year: number,
      cat: RecommendationCategory,
      genre: number | string,
      reg: RecommendationRegion
    ) => {
      setLoadingYears((prev) => ({ ...prev, [year]: true }));
      try {
        const item = await fetchBestOfYear(year, cat, genre, reg);
        setYearData((prev) => ({ ...prev, [year]: item }));
      } catch (err) {
        console.error(`Error loading recommendation for ${year}:`, err);
        setYearData((prev) => ({ ...prev, [year]: null }));
      } finally {
        setLoadingYears((prev) => ({ ...prev, [year]: false }));
      }
    },
    []
  );

  // When filters change, reset loaded state
  useEffect(() => {
    setYearData({});
    setLoadingYears({});
    setVisibleCount(BATCH_SIZE);
  }, [category, selectedGenre, region]);

  // Load items for currently visible years in batches
  useEffect(() => {
    visibleYears.forEach((year) => {
      if (yearData[year] === undefined && !loadingYears[year]) {
        loadYear(year, category, selectedGenre, region);
      }
    });
  }, [visibleYears, category, selectedGenre, region, yearData, loadingYears, loadYear]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, ALL_YEARS.length));
  };

  const handleScrollToYear = (targetYear: number) => {
    const el = document.getElementById(`year-card-${targetYear}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const index = ALL_YEARS.indexOf(targetYear);
      if (index !== -1) {
        setVisibleCount(Math.max(visibleCount, index + 6));
        setTimeout(() => {
          const targetEl = document.getElementById(`year-card-${targetYear}`);
          targetEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  };

  const handleResetFilters = () => {
    setCategory('all');
    setSelectedGenre('all');
    setRegion('all');
  };

  // Quick decades for jump navigation
  const decades = [2026, 2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      <ScrollToTop />

      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 pb-28 lg:pb-16 max-w-7xl mx-auto w-full">
        {/* Hero Header */}
        <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 p-6 sm:p-10 mb-8 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-4 tracking-wide uppercase">
              <Award className="w-3.5 h-3.5" />
              <span>Smart Recommendation Engine</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
              Yearly Best: <span className="text-primary">2026 – 1950</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Discover the absolute highest rated, critically acclaimed masterworks year by year. Tailor your discovery across Movies, Series, K-Dramas, Anime, specific genres, and industry regions.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="mt-8 space-y-5 pt-6 border-t border-border/40">
            {/* Category selection */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[70px] flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-primary" /> Format:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setCategory('all')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    category === 'all'
                      ? 'bg-primary text-black font-bold shadow-md shadow-primary/20'
                      : 'bg-white/[0.04] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  All Formats
                </button>
                <button
                  onClick={() => setCategory('movie')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    category === 'movie'
                      ? 'bg-primary text-black font-bold shadow-md shadow-primary/20'
                      : 'bg-white/[0.04] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  Movies
                </button>
                <button
                  onClick={() => setCategory('tv')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    category === 'tv'
                      ? 'bg-primary text-black font-bold shadow-md shadow-primary/20'
                      : 'bg-white/[0.04] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  Series / TV
                </button>
                <button
                  onClick={() => setCategory('kdrama')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    category === 'kdrama'
                      ? 'bg-primary text-black font-bold shadow-md shadow-primary/20'
                      : 'bg-white/[0.04] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                >
                  <span>🇰🇷</span> K-Drama
                </button>
                <button
                  onClick={() => setCategory('anime')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    category === 'anime'
                      ? 'bg-primary text-black font-bold shadow-md shadow-primary/20'
                      : 'bg-white/[0.04] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                >
                  <span>⚡</span> Anime
                </button>
              </div>
            </div>

            {/* Region selection (only for movie, series, all) */}
            {showRegionFilter && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[70px] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Region:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {REGION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setRegion(opt.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        region === opt.id
                          ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20'
                          : 'bg-white/[0.04] text-neutral-300 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>{opt.flag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Genre selection chips */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Genre Filter:
                </span>
                {(category !== 'all' || selectedGenre !== 'all' || region !== 'all') && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset all
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 max-h-24 scrollbar-thin">
                {availableGenres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenre(g.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                      String(selectedGenre) === String(g.id)
                        ? 'bg-white text-black font-bold shadow'
                        : 'bg-white/[0.03] text-neutral-400 hover:text-white border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Decade Quick Jump */}
            <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> Jump to Year:
              </span>
              {decades.map((dec) => (
                <button
                  key={dec}
                  onClick={() => handleScrollToYear(dec)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/10 text-neutral-300 hover:text-black hover:bg-primary hover:border-primary transition-all active:scale-95"
                >
                  {dec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Year-by-Year Feed */}
        <div className="space-y-6">
          {visibleYears.map((year, index) => {
            const item = yearData[year];
            const isLoading = loadingYears[year] || item === undefined;
            const isFuture = year > new Date().getFullYear();

            return (
              <div
                key={year}
                id={`year-card-${year}`}
                className="relative rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm p-4 sm:p-6 transition-all hover:border-white/20 shadow-sm"
              >
                {/* Year Header Banner */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-1.5 font-['Poppins']">
                      <span className="text-primary font-mono">#</span>
                      {year}
                    </span>
                    {isFuture ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        <Flame className="w-3 h-3" /> Most Anticipated Pick
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                        <Award className="w-3 h-3" /> Top Recommended of {year}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground font-mono">
                    Year #{index + 1}
                  </span>
                </div>

                {/* Content body */}
                {isLoading ? (
                  <div className="h-44 sm:h-56 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs font-medium">Evaluating highest-rated masterpiece for {year}...</span>
                  </div>
                ) : item ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                    {/* Visual Card preview */}
                    <div className="sm:col-span-4 md:col-span-3 flex justify-center sm:justify-start">
                      <div className="w-full max-w-[210px]">
                        <ContentCard item={item} />
                      </div>
                    </div>

                    {/* Detailed Showcase */}
                    <div className="sm:col-span-8 md:col-span-9 flex flex-col justify-between min-h-[220px] space-y-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/[0.08] text-white capitalize">
                            {item.media_type === 'movie' ? '🎬 Feature Film' : '📺 Television Series'}
                          </span>
                          {item.rating > 0 && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-primary text-primary" />
                              {item.rating.toFixed(1)} / 10
                            </span>
                          )}
                          {item.vote_count ? (
                            <span className="text-xs text-muted-foreground">
                              ({item.vote_count.toLocaleString()} TMDB votes)
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug">
                          {item.title}
                        </h2>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          {item.overview || "No detailed synopsis available for this title."}
                        </p>
                      </div>

                      {/* Release date & badge info */}
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          <span className="font-semibold text-neutral-300">Release Date: </span>
                          {item.release_date || `${year}`}
                        </div>
                        <div className="text-primary font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Rank #1 for {year}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 flex flex-col items-center justify-center text-muted-foreground text-center px-4">
                    <p className="text-sm">No title matched this filter criteria for {year}.</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Try switching to &quot;All Formats&quot; or selecting &quot;All Genres&quot;.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {visibleCount < ALL_YEARS.length && (
          <div className="mt-12 text-center">
            <Button
              size="lg"
              onClick={handleLoadMore}
              className="bg-primary hover:bg-primary/90 text-black font-bold px-8 shadow-lg shadow-primary/20 rounded-2xl"
            >
              Load Next {Math.min(BATCH_SIZE, ALL_YEARS.length - visibleCount)} Years (Next down to{' '}
              {ALL_YEARS[Math.min(visibleCount + BATCH_SIZE - 1, ALL_YEARS.length - 1)]})
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Viewing {visibleCount} of {ALL_YEARS.length} years (2026 to 1950)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
