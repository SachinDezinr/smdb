import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
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
  Calendar,
  Film,
  Tv,
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
  const [category, setCategory] = useState<RecommendationCategory>('movie');
  const [region, setRegion] = useState<RecommendationRegion>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const [scanLimit, setScanLimit] = useState<number>(INITIAL_YEARS_COUNT);
  const [yearData, setYearData] = useState<Record<number, ContentItem | null>>({});
  const [loadingYears, setLoadingYears] = useState<Record<number, boolean>>({});

  // Available genres based on category & region (Western & News removed for Indian regions, kdrama, anime)
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
        return g.id !== 37 && g.id !== 10763 && !name.includes('western') && !name.includes('news');
      });
    }

    return baseList;
  }, [category, region]);

  useEffect(() => {
    if (selectedGenre !== 'all' && !availableGenres.some((g) => String(g.id) === String(selectedGenre))) {
      setSelectedGenre('all');
    }
  }, [category, availableGenres, selectedGenre]);

  const showRegionFilter = category === 'movie' || category === 'tv';

  const scannedYears = useMemo(() => {
    return ALL_YEARS.slice(0, scanLimit);
  }, [scanLimit]);

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

  useEffect(() => {
    setYearData({});
    setLoadingYears({});
    setScanLimit(INITIAL_YEARS_COUNT);
  }, [category, selectedGenre, region]);

  useEffect(() => {
    scannedYears.forEach((year) => {
      if (yearData[year] === undefined && !loadingYears[year]) {
        loadYear(year, category, selectedGenre, region);
      }
    });
  }, [scannedYears, category, selectedGenre, region, yearData, loadingYears, loadYear]);

  // Hide empty years like Netflix & Prime
  const validYearEntries = useMemo(() => {
    return scannedYears
      .map((year) => ({
        year,
        item: yearData[year],
        isLoading: loadingYears[year] || yearData[year] === undefined,
      }))
      .filter((entry) => entry.isLoading || entry.item !== null);
  }, [scannedYears, yearData, loadingYears]);

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

      <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 pb-28 lg:pb-16 max-w-6xl mx-auto w-full">
        {/* Compact Modern Header */}
        <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 p-4 sm:p-5 mb-5 backdrop-blur-xl shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold mb-1.5 uppercase tracking-wide">
                <Award className="w-3 h-3" />
                <span>Hall of Fame</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Recommendations <span className="text-primary font-mono text-lg sm:text-xl font-bold">2026-1950</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground md:text-right max-w-sm">
              Chronologically top-voted picks.
            </p>
          </div>

          {/* Controls: Dropdown Filter Bar */}
          <div className="mt-4 pt-3.5 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Format Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clapperboard className="w-3 h-3 text-primary" /> Format
              </label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as RecommendationCategory)}
              >
                <SelectTrigger className="w-full h-9 bg-white/[0.04] border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-medium focus:ring-primary/40">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-xl shadow-2xl">
                  <SelectItem value="movie" className="hover:bg-white/10 text-xs cursor-pointer">
                    🎬 Movie
                  </SelectItem>
                  <SelectItem value="tv" className="hover:bg-white/10 text-xs cursor-pointer">
                    📺 Series / Shows
                  </SelectItem>
                  <SelectItem value="kdrama" className="hover:bg-white/10 text-xs cursor-pointer">
                    🇰🇷 K-Drama
                  </SelectItem>
                  <SelectItem value="anime" className="hover:bg-white/10 text-xs cursor-pointer">
                    ⚡ Anime
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region Dropdown */}
            {showRegionFilter ? (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3 text-primary" /> Region
                </label>
                <Select
                  value={region}
                  onValueChange={(val) => setRegion(val as RecommendationRegion)}
                >
                  <SelectTrigger className="w-full h-9 bg-white/[0.04] border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-medium focus:ring-primary/40">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-xl shadow-2xl">
                    {REGION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id} className="hover:bg-white/10 text-xs cursor-pointer">
                        <span className="mr-2">{opt.flag}</span>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1 opacity-60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3 text-primary" /> Region
                </label>
                <div className="w-full h-9 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 text-xs flex items-center text-muted-foreground">
                  {category === 'kdrama' ? '🇰🇷 South Korea' : '🇯🇵 Japan'}
                </div>
              </div>
            )}

            {/* Genre Dropdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-primary" /> Genre
                </label>
                {(selectedGenre !== 'all' || region !== 'all' || category !== 'movie') && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                  </button>
                )}
              </div>
              <Select
                value={String(selectedGenre)}
                onValueChange={(val) => setSelectedGenre(val)}
              >
                <SelectTrigger className="w-full h-9 bg-white/[0.04] border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-medium focus:ring-primary/40">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-xl shadow-2xl max-h-72">
                  {availableGenres.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)} className="hover:bg-white/10 text-xs cursor-pointer">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Year-by-Year Feed */}
        <div className="space-y-4">
          {validYearEntries.map(({ year, item, isLoading }, index) => {
            const isFuture = year > new Date().getFullYear();

            return (
              <div
                key={year}
                id={`year-card-${year}`}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.04] backdrop-blur-md p-3.5 sm:p-5 transition-all duration-200 hover:border-white/20 shadow-md"
              >
                {/* Year Header Bar */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1 font-['Poppins']">
                      <span className="text-primary font-mono text-base sm:text-lg">#</span>
                      {year}
                    </span>
                    {isFuture ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        <Flame className="w-2.5 h-2.5" /> Anticipated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                        <Award className="w-2.5 h-2.5" /> Top Pick
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-muted-foreground font-mono">
                    Year #{index + 1}
                  </span>
                </div>

                {/* Content body */}
                {isLoading ? (
                  <div className="h-32 sm:h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-xs font-medium">Finding best pick for {year}...</span>
                  </div>
                ) : item ? (
                  <div className="flex flex-row items-start gap-3 sm:gap-5">
                    {/* Left Column: Poster + Rating directly underneath */}
                    <div className="flex-shrink-0 w-25 sm:w-33 md:w-37 flex flex-col items-center gap-1.5">
                      <div className="w-full">
                        <ContentCard item={item} />
                      </div>
                    </div>

                    {/* Right Column: Title, Format tag, Synopsis, and Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div>
                        {/* Format & release metadata */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded bg-white/[0.08] text-white/90">
                            {item.media_type === 'movie' ? '🎬 Movie' : '📺 Series'}
                          </span>
                          {item.release_date && item.release_date !== 'TBA' && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {item.release_date}
                            </span>
                          )}
                          {item.vote_count ? (
                            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                              • {item.vote_count.toLocaleString()} votes
                            </span>
                          ) : null}
                        </div>

                        {/* Title */}
                        <h2 className="text-sm sm:text-lg md:text-xl font-black text-white leading-tight mb-1.5 line-clamp-2">
                          {item.title}
                        </h2>

                        {/* Synopsis */}
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-4 sm:line-clamp-4">
                          {item.overview || 'No synopsis available for this title.'}
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="text-primary font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Rank #1 of {year}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Empty State when no results found */}
        {!isAnyLoading && validYearEntries.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-white/10 bg-white/[0.02] p-6 max-w-md mx-auto">
            <SlidersHorizontal className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
            <h3 className="text-base font-bold text-white mb-1">No Matching Titles Found</h3>
            <p className="text-xs text-muted-foreground mb-4">
              No titles matched your combination of format, region, and genre in recent years. Try selecting &quot;All Genres&quot;.
            </p>
            <Button
              size="sm"
              onClick={handleResetFilters}
              className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Load More Years Button */}
        {scanLimit < ALL_YEARS.length && (
          <div className="mt-8 text-center">
            <Button
              size="sm"
              disabled={isAnyLoading}
              onClick={handleLoadMoreYears}
              className="bg-primary hover:bg-primary/90 text-black font-bold px-6 shadow-md shadow-primary/20 rounded-xl text-xs h-9"
            >
              {isAnyLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Loading Years...
                </>
              ) : (
                <>
                  Load Older Years (Down to{' '}
                  {ALL_YEARS[Math.min(scanLimit + STEP_YEARS_COUNT - 1, ALL_YEARS.length - 1)]})
                  <ChevronDown className="ml-1.5 w-3.5 h-3.5" />
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Showing years with recommended content (Scanned {scanLimit} of {ALL_YEARS.length} years)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
