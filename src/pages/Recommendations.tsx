import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { RecommendationRowCard } from '@/components/content/RecommendationRowCard';
import { ContentItem } from '@/lib/tmdb/types';
import { fetchBestOfYear } from '@/lib/tmdb/queries';
import { MOVIE_GENRES, TV_GENRES, COMMON_GENRES, GenreOption } from '@/lib/tmdb/genres';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import {
  Award,
  ChevronDown,
  Loader2,
  SlidersHorizontal,
  Flame,
  Star,
  Clapperboard,
  Globe,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type RecommendationCategory = 'movie' | 'tv' | 'kdrama' | 'anime';
export type RecommendationRegion = 'all' | 'hollywood' | 'bollywood' | 'pollywood' | 'tollywood';

// Full year range from 2026 down to 1950 (new to old)
const ALL_YEARS: number[] = [];
for (let y = 2026; y >= 1950; y--) {
  ALL_YEARS.push(y);
}

// Initial batch size of years evaluated
const INITIAL_YEARS_COUNT = 15;
const STEP_YEARS_COUNT = 12;

const REGION_OPTIONS: { id: RecommendationRegion; label: string; flag: string }[] = [
  { id: 'all', label: 'All Industries / Regions', flag: '🌐' },
  { id: 'hollywood', label: 'Hollywood (English)', flag: '🇺🇸' },
  { id: 'bollywood', label: 'Bollywood (Hindi)', flag: '🇮🇳' },
  { id: 'tollywood', label: 'Tollywood (Telugu)', flag: '🇮🇳' },
  { id: 'pollywood', label: 'Pollywood (Punjabi)', flag: '🇮🇳' },
];

export default function Recommendations() {
  // Format is strictly Movie, Series/Shows, K-Drama, or Anime (no "All format")
  const [category, setCategory] = useState<RecommendationCategory>('movie');
  const [region, setRegion] = useState<RecommendationRegion>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const [scanLimit, setScanLimit] = useState<number>(INITIAL_YEARS_COUNT);
  const [yearData, setYearData] = useState<Record<number, ContentItem | null>>({});
  const [loadingYears, setLoadingYears] = useState<Record<number, boolean>>({});

  // Determine available genres based on active category and region
  // Filters out Western and News for Indian regions (bollywood, pollywood, tollywood), kdrama, and anime
  const availableGenres = useMemo<GenreOption[]>(() => {
    let baseList: GenreOption[] = [];
    if (category === 'movie') baseList = MOVIE_GENRES;
    else if (category === 'tv' || category === 'kdrama') baseList = TV_GENRES;
    else baseList = COMMON_GENRES;

    const isIndianRegion = region === 'bollywood' || region === 'pollywood' || region === 'tollywood';
    const isExcludedContext = isIndianRegion || category === 'kdrama' || category === 'anime';

    if (isExcludedContext) {
      return baseList.filter((g) => {
        const name = g.name.toLowerCase();
        // Remove Western (id 37) and News (id 10763)
        return g.id !== 37 && g.id !== 10763 && !name.includes('western') && !name.includes('news');
      });
    }

    return baseList;
  }, [category, region]);

  // Reset genre if not valid in current format
  useEffect(() => {
    if (selectedGenre !== 'all' && !availableGenres.some((g) => String(g.id) === String(selectedGenre))) {
      setSelectedGenre('all');
    }
  }, [category, availableGenres, selectedGenre]);

  // Region filter applies only to Movies and Series/Shows (K-Drama & Anime are naturally region-specific)
  const showRegionFilter = category === 'movie' || category === 'tv';

  // Sliced years currently being scanned
  const scannedYears = useMemo(() => {
    return ALL_YEARS.slice(0, scanLimit);
  }, [scanLimit]);

  // Fetch best item for a given year
  const loadYear = useCallback(
    async (
      year: number,
      cat: RecommendationCategory,
      genre: string,
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

  // Automatically reset results when filters change (auto update)
  useEffect(() => {
    setYearData({});
    setLoadingYears({});
    setScanLimit(INITIAL_YEARS_COUNT);
  }, [category, selectedGenre, region]);

  // Automatically query items for scanned years
  useEffect(() => {
    scannedYears.forEach((year) => {
      if (yearData[year] === undefined && !loadingYears[year]) {
        loadYear(year, category, selectedGenre, region);
      }
    });
  }, [scannedYears, category, selectedGenre, region, yearData, loadingYears, loadYear]);

  // Filter out any year that has finished loading and has NO content (completely hide them like Netflix / Prime)
  const validYearEntries = useMemo(() => {
    return scannedYears
      .map((year) => ({
        year,
        item: yearData[year],
        isLoading: loadingYears[year] || yearData[year] === undefined,
      }))
      .filter((entry) => {
        // Keep if still loading (to show skeleton/loader) or has an actual item
        return entry.isLoading || entry.item !== null;
      });
  }, [scannedYears, yearData, loadingYears]);

  // Are there any active requests currently fetching?
  const isAnyLoading = useMemo(() => {
    return scannedYears.some((year) => loadingYears[year] || yearData[year] === undefined);
  }, [scannedYears, loadingYears, yearData]);

  const handleLoadMoreYears = () => {
    setScanLimit((prev) => Math.min(prev + STEP_YEARS_COUNT, ALL_YEARS.length));
  };

  const handleResetFilters = () => {
    setCategory('movie');
    setRegion('all');
    setSelectedGenre('all');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      <ScrollToTop />

      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 pb-28 lg:pb-16 max-w-7xl mx-auto w-full">
        {/* Compact Hero Header */}
        <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 p-4 sm:p-6 mb-6 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-semibold mb-2 tracking-wide uppercase">
                <Award className="w-3 h-3" />
                <span>Hall of Fame</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Recommendations <span className="text-primary font-mono">2026 – 1950</span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Top-rated masterworks chronologically ordered from newest to oldest. Select filters to update automatically.
            </p>
          </div>

          {/* Controls: Dropdown Filter Bar */}
          <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Format Dropdown (Movie, Series/Shows, K-Drama, Anime) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-primary" /> Format
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as RecommendationCategory)}
              >
                <SelectTrigger className="w-full h-11 bg-white/[0.04] border-white/10 hover:border-white/20 text-white rounded-xl font-medium focus:ring-primary/40">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-xl shadow-2xl">
                  <SelectItem value="movie" className="hover:bg-white/10 cursor-pointer">
                    🎬 Movie
                  </SelectItem>
                  <SelectItem value="tv" className="hover:bg-white/10 cursor-pointer">
                    📺 Series / Shows
                  </SelectItem>
                  <SelectItem value="kdrama" className="hover:bg-white/10 cursor-pointer">
                    🇰🇷 K-Drama
                  </SelectItem>
                  <SelectItem value="anime" className="hover:bg-white/10 cursor-pointer">
                    ⚡ Anime
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region Dropdown (Only for Movie & Series/Shows) */}
            {showRegionFilter ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Region / Industry
                </label>
                <Select
                  value={region}
                  onValueChange={(val) => setRegion(val as RecommendationRegion)}
                >
                  <SelectTrigger className="w-full h-11 bg-white/[0.04] border-white/10 hover:border-white/20 text-white rounded-xl font-medium focus:ring-primary/40">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-xl shadow-2xl">
                    {REGION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id} className="hover:bg-white/10 cursor-pointer">
                        <span className="mr-2">{opt.flag}</span>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Region / Industry
                </label>
                <div className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2 text-xs flex items-center text-muted-foreground">
                  {category === 'kdrama' ? '🇰🇷 Native South Korea' : '🇯🇵 Native Japan'}
                </div>
              </div>
            )}

            {/* Genre Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Genre
                </label>
                {(selectedGenre !== 'all' || region !== 'all' || category !== 'movie') && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                  </button>
                )}
              </div>
              <Select
                value={String(selectedGenre)}
                onValueChange={(val) => setSelectedGenre(val)}
              >
                <SelectTrigger className="w-full h-11 bg-white/[0.04] border-white/10 hover:border-white/20 text-white rounded-xl font-medium focus:ring-primary/40">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-xl shadow-2xl max-h-72">
                  {availableGenres.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)} className="hover:bg-white/10 cursor-pointer">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Year-by-Year Feed (Empty years are automatically hidden) */}
        <div className="space-y-4 sm:space-y-6">
          {validYearEntries.map(({ year, item, isLoading }, index) => {
            const isFuture = year > new Date().getFullYear();

            return (
              <div
                key={year}
                id={`year-card-${year}`}
                className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm p-3.5 sm:p-5 transition-all hover:border-white/20 shadow-sm"
              >
                {/* Year Header Banner */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1 font-['Poppins']">
                      <span className="text-primary font-mono">#</span>
                      {year}
                    </span>
                    {isFuture ? (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        <Flame className="w-3 h-3" /> Anticipated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                        <Award className="w-3 h-3" /> Top Pick of {year}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] sm:text-xs text-muted-foreground font-mono">
                    Year #{index + 1}
                  </span>
                </div>

                {/* Content body: Sleek horizontal row card for phone, tablet, and PC */}
                {isLoading ? (
                  <div className="h-36 sm:h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-xs font-medium">Finding best recommendation for {year}...</span>
                  </div>
                ) : item ? (
                  <RecommendationRowCard item={item} year={year} />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Empty State when no results found at all in scanned window */}
        {!isAnyLoading && validYearEntries.length === 0 && (
          <div className="py-20 text-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-lg mx-auto">
            <SlidersHorizontal className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white mb-1">No Matching Titles Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              No content matched your combination of format, region, and genre in recent years. Try choosing &quot;All Genres&quot; or resetting filters.
            </p>
            <Button
              onClick={handleResetFilters}
              className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Load More Years Button */}
        {scanLimit < ALL_YEARS.length && (
          <div className="mt-12 text-center">
            <Button
              size="lg"
              disabled={isAnyLoading}
              onClick={handleLoadMoreYears}
              className="bg-primary hover:bg-primary/90 text-black font-bold px-8 shadow-lg shadow-primary/20 rounded-2xl"
            >
              {isAnyLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading Years...
                </>
              ) : (
                <>
                  Load Older Years (Next down to{' '}
                  {ALL_YEARS[Math.min(scanLimit + STEP_YEARS_COUNT - 1, ALL_YEARS.length - 1)]})
                  <ChevronDown className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Showing years with recommended content (Scanned {scanLimit} of {ALL_YEARS.length} years)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
