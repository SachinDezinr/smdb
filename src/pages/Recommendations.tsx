import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentItem } from '@/lib/tmdb/types';
import { fetchBestOfYear } from '@/lib/tmdb/queries';
import { MOVIE_GENRES, TV_GENRES, COMMON_GENRES, GenreOption } from '@/lib/tmdb/genres';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { ChevronDown, Clapperboard, Globe, Loader2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type RecommendationCategory = 'movie' | 'tv' | 'kdrama' | 'anime';
export type RecommendationRegion = 'all' | 'hollywood' | 'bollywood' | 'pollywood' | 'tollywood';

/* ------------------------------ constants ------------------------------ */

const END_YEAR = 1950;
const START_YEAR = Math.max(2026, new Date().getFullYear());
const ALL_YEARS: number[] = Array.from(
  { length: START_YEAR - END_YEAR + 1 },
  (_, i) => START_YEAR - i
);

const INITIAL_YEARS_COUNT = 15;
const STEP_YEARS_COUNT = 12;

const FORMAT_OPTIONS: { id: RecommendationCategory; label: string; emoji: string }[] = [
  { id: 'movie', label: 'Movies', emoji: '🎬' },
  { id: 'tv', label: 'Series', emoji: '📺' },
  { id: 'kdrama', label: 'K-Drama', emoji: '🇰🇷' },
  { id: 'anime', label: 'Anime', emoji: '⚡' },
];

const REGION_OPTIONS: { id: RecommendationRegion; label: string }[] = [
  { id: 'all', label: 'All regions' },
  { id: 'hollywood', label: 'Hollywood' },
  { id: 'bollywood', label: 'Bollywood' },
  { id: 'tollywood', label: 'Tollywood' },
  { id: 'pollywood', label: 'Pollywood' },
];

const REGION_LABELS: Record<RecommendationRegion, string> = {
  all: 'all regions',
  hollywood: 'Hollywood (English)',
  bollywood: 'Bollywood (Hindi)',
  tollywood: 'Tollywood (Telugu)',
  pollywood: 'Pollywood (Punjabi)',
};

const triggerClass =
  'h-9 w-full rounded-xl border-white/10 bg-white/[0.04] text-xs font-medium text-white hover:border-white/20 focus:ring-primary/40';
const contentClass = 'rounded-xl border-white/10 bg-neutral-900 text-white shadow-2xl';
const itemClass = 'cursor-pointer text-xs hover:bg-white/10';

const EMPTY_DATA: Record<number, ContentItem | null> = {};

/* ------------------------------ sub-components ------------------------------ */

const YearSkeleton = memo(function YearSkeleton() {
  return (
    <div className="flex gap-3 sm:gap-5" aria-hidden="true">
      <div className="w-32 sm:w-36 md:w-40 shrink-0 aspect-[2/3] rounded-xl bg-white/[0.06] motion-safe:animate-pulse" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-3 w-28 rounded bg-white/[0.06] motion-safe:animate-pulse" />
        <div className="h-5 w-2/3 rounded bg-white/[0.08] motion-safe:animate-pulse" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded bg-white/[0.05] motion-safe:animate-pulse" />
          <div className="h-3 w-11/12 rounded bg-white/[0.05] motion-safe:animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-white/[0.05] motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
});

interface YearEntryProps {
  year: number;
  item: ContentItem | null | undefined;
  isLoading: boolean;
}

const YearEntry = memo(function YearEntry({ year, item, isLoading }: YearEntryProps) {
  return (
    <li id={`year-card-${year}`} className="flex gap-6 scroll-mt-40">
      {/* Timeline rail: the year is the structure of this page */}
      <div className="relative hidden sm:block w-24 shrink-0 border-r border-white/10 pr-5 text-right">
        <span
          className={cn(
            'sticky top-36 block text-3xl font-black tabular-nums tracking-tight leading-none transition-colors',
            isLoading ? 'text-white/25' : 'text-white'
          )}
        >
          {year}
        </span>
        <span
          className={cn(
            'absolute -right-[4.5px] top-3 h-2 w-2 rounded-full ring-4 ring-background',
            isLoading ? 'bg-white/20' : 'bg-primary'
          )}
        />
      </div>

      {/* Entry */}
      <article className="flex-1 min-w-0 pb-6 sm:pb-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
          <p
            className={cn(
              'mb-3 text-xl font-black tabular-nums leading-none sm:hidden',
              isLoading ? 'text-white/25' : 'text-white'
            )}
          >
            {year}
          </p>

          {isLoading || !item ? (
            <YearSkeleton />
          ) : (
            <div className="flex gap-3 sm:gap-5">
              {/* Poster */}
              <div className="w-32 sm:w-36 md:w-40 shrink-0">
                <ContentCard item={item} />
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="rounded-md bg-white/[0.08] px-2 py-0.5 font-medium text-white/90">
                    {item.media_type === 'movie' ? 'Movie' : 'Series'}
                  </span>
                  {item.release_date && item.release_date !== 'TBA' && (
                    <span>Released {item.release_date}</span>
                  )}
                  {item.vote_count ? (
                    <span className="hidden sm:inline">{item.vote_count.toLocaleString()} votes</span>
                  ) : null}
                </div>

                <h2 className="mb-2 text-base sm:text-xl font-bold leading-snug text-white line-clamp-2">
                  {item.title}
                </h2>

                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-4 sm:line-clamp-5 max-w-prose">
                  {item.overview || 'No synopsis available for this title.'}
                </p>

                <p className="mt-3 text-[11px] text-neutral-500">
                  Tap the poster to watch the trailer and see details.
                </p>
              </div>
            </div>
          )}
        </div>
      </article>
    </li>
  );
});

/* ------------------------------ page ------------------------------ */

export default function Recommendations() {
  const [category, setCategory] = useState<RecommendationCategory>('movie');
  const [region, setRegion] = useState<RecommendationRegion>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  /* ---- genres available for the current category / region ---- */
  const availableGenres = useMemo<GenreOption[]>(() => {
    let baseList: GenreOption[];
    if (category === 'movie') baseList = MOVIE_GENRES;
    else if (category === 'tv' || category === 'kdrama') baseList = TV_GENRES;
    else baseList = COMMON_GENRES;

    const isIndianRegion = region === 'bollywood' || region === 'pollywood' || region === 'tollywood';
    if (isIndianRegion || category === 'kdrama' || category === 'anime') {
      return baseList.filter((g) => {
        const name = g.name.toLowerCase();
        return g.id !== 37 && g.id !== 10763 && !name.includes('western') && !name.includes('news');
      });
    }
    return baseList;
  }, [category, region]);

  // Derived instead of synced via an effect: avoids a second fetch round
  // when a genre stops being valid after switching format or region.
  const genre = useMemo(
    () =>
      selectedGenre === 'all' || availableGenres.some((g) => String(g.id) === selectedGenre)
        ? selectedGenre
        : 'all',
    [selectedGenre, availableGenres]
  );

  const showRegionFilter = category === 'movie' || category === 'tv';
  // Region is irrelevant for K-Drama / Anime, so keep it out of the query key.
  const effectiveRegion: RecommendationRegion = showRegionFilter ? region : 'all';

  const filterKey = `${category}|${genre}|${effectiveRegion}`;

  /* ---- results cache, keyed by filters so stale responses can't leak in ---- */
  const [cache, setCache] = useState<{ key: string; data: Record<number, ContentItem | null> }>({
    key: filterKey,
    data: EMPTY_DATA,
  });
  const [limitState, setLimitState] = useState<{ key: string; limit: number }>({
    key: filterKey,
    limit: INITIAL_YEARS_COUNT,
  });
  const requested = useRef<{ key: string; years: Set<number> }>({ key: filterKey, years: new Set() });
  const controllerRef = useRef<{ key: string; controller: AbortController } | null>(null);

  const yearData = cache.key === filterKey ? cache.data : EMPTY_DATA;
  const scanLimit = limitState.key === filterKey ? limitState.limit : INITIAL_YEARS_COUNT;
  const scannedYears = useMemo(() => ALL_YEARS.slice(0, scanLimit), [scanLimit]);

  useEffect(() => {
    if (requested.current.key !== filterKey) {
      requested.current = { key: filterKey, years: new Set() };
    }
    const bucket = requested.current;

    // One AbortController per filter set: changing filters drops the old set's queued requests
    if (!controllerRef.current || controllerRef.current.key !== filterKey) {
      controllerRef.current?.controller.abort();
      controllerRef.current = { key: filterKey, controller: new AbortController() };
    }
    const { signal } = controllerRef.current.controller;

    scannedYears.forEach((year) => {
      if (bucket.years.has(year)) return;
      bucket.years.add(year);

      fetchBestOfYear(year, category, genre, effectiveRegion, signal)
        .catch((err) => {
          console.error(`Error loading recommendation for ${year}:`, err);
          return null;
        })
        .then((item) => {
          // Ignore responses that belong to filters the user has already left.
          if (requested.current !== bucket) return;
          setCache((prev) => ({
            key: filterKey,
            data: { ...(prev.key === filterKey ? prev.data : {}), [year]: item },
          }));
        });
    });
  }, [scannedYears, filterKey, category, genre, effectiveRegion]);

  /* ---- derived list ---- */
  const entries = useMemo(
    () =>
      scannedYears
        .map((year) => ({
          year,
          item: yearData[year],
          isLoading: yearData[year] === undefined,
        }))
        // hide years with no result once loaded
        .filter((e) => e.isLoading || e.item !== null),
    [scannedYears, yearData]
  );

  const isAnyLoading = scannedYears.some((y) => yearData[y] === undefined);
  const canLoadMore = scanLimit < ALL_YEARS.length;
  const nextEndYear = ALL_YEARS[Math.min(scanLimit + STEP_YEARS_COUNT - 1, ALL_YEARS.length - 1)];

  const loadMore = useCallback(() => {
    setLimitState({
      key: filterKey,
      limit: Math.min(scanLimit + STEP_YEARS_COUNT, ALL_YEARS.length),
    });
  }, [filterKey, scanLimit]);

  // Auto-load older years when the bottom comes into view
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !canLoadMore) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isAnyLoading) loadMore();
      },
      { rootMargin: '500px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canLoadMore, isAnyLoading, loadMore]);

  /* ---- handlers ---- */
  const hasActiveFilters = genre !== 'all' || effectiveRegion !== 'all' || category !== 'movie';

  const handleResetFilters = () => {
    setCategory('movie');
    setRegion('all');
    setSelectedGenre('all');
  };

  const summary = useMemo(() => {
    const format = FORMAT_OPTIONS.find((f) => f.id === category)?.label.toLowerCase() ?? '';
    const genreName = availableGenres.find((g) => String(g.id) === genre)?.name;
    return [
      `Top-rated ${genreName && genre !== 'all' ? `${genreName.toLowerCase()} ` : ''}${format}`,
      showRegionFilter && effectiveRegion !== 'all' ? `from ${REGION_LABELS[effectiveRegion]}` : null,
      `, one per year`,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(' ,', ',');
  }, [category, genre, availableGenres, showRegionFilter, effectiveRegion]);

  /* ---- render ---- */
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      <ScrollToTop />

      <main className="mx-auto w-full max-w-5xl flex-1 px-3.5 sm:px-6 md:px-8 lg:px-10 pb-28 lg:pb-16">
        {/* Header */}
        <header className="relative pt-6 sm:pt-10 pb-5">
          <div
            className="pointer-events-none absolute inset-x-0 -top-10 h-56 bg-[radial-gradient(60%_80%_at_20%_0%,hsl(var(--primary)/0.14),transparent)]"
            aria-hidden="true"
          />
          <h1 className="relative text-2xl sm:text-4xl font-black tracking-tight text-white">
            Best of every year
          </h1>
          <p className="relative mt-1.5 text-sm text-muted-foreground">
            {START_YEAR} back to {END_YEAR}. {summary}.
          </p>
        </header>

        {/* Sticky filter bar */}
        <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 md:-mx-8 lg:-mx-10 border-y border-white/10 bg-background/80 px-3.5 sm:px-6 md:px-8 lg:px-10 py-3 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {/* Format */}
            <Select value={category} onValueChange={(v) => setCategory(v as RecommendationCategory)}>
              <SelectTrigger aria-label="Format" className={triggerClass}>
                <Clapperboard className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent className={contentClass}>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className={itemClass}>
                    <span className="mr-2" aria-hidden="true">{opt.emoji}</span>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Region (movies and series); fixed for K-Drama and Anime */}
            {showRegionFilter ? (
              <Select value={region} onValueChange={(v) => setRegion(v as RecommendationRegion)}>
                <SelectTrigger aria-label="Region" className={triggerClass}>
                  <Globe className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent className={contentClass}>
                  {REGION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className={itemClass}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div
                aria-label="Region"
                className="flex h-9 items-center rounded-xl border border-white/5 bg-white/[0.02] px-3 text-xs font-medium text-muted-foreground"
              >
                <Globe className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                {category === 'kdrama' ? 'South Korea' : 'Japan'}
              </div>
            )}

            {/* Genre + reset */}
            <div className="col-span-2 flex gap-2 sm:col-span-1">
              <Select value={genre} onValueChange={setSelectedGenre}>
                <SelectTrigger aria-label="Genre" className={triggerClass}>
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent className={cn(contentClass, 'max-h-72')}>
                  {availableGenres.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)} className={itemClass}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  aria-label="Reset filters"
                  title="Reset filters"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ol className="mt-6 sm:mt-8" aria-busy={isAnyLoading}>
          {entries.map(({ year, item, isLoading }) => (
            <YearEntry key={year} year={year} item={item} isLoading={isLoading} />
          ))}
        </ol>

        {/* Empty state */}
        {!isAnyLoading && !canLoadMore && entries.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-14 text-center">
            <SlidersHorizontal className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            <h3 className="mb-1 text-base font-bold text-white">No titles match these filters</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Try a different genre or region, or reset to see all movies.
            </p>
            <Button
              size="sm"
              onClick={handleResetFilters}
              className="rounded-xl bg-primary text-xs font-bold text-black hover:bg-primary/90"
            >
              Reset filters
            </Button>
          </div>
        )}

        {/* Load more */}
        {canLoadMore && (
          <div ref={sentinelRef} className="pt-2 text-center">
            <Button
              size="sm"
              variant="outline"
              disabled={isAnyLoading}
              onClick={loadMore}
              className="h-9 rounded-xl border-white/15 bg-white/[0.04] px-5 text-xs font-semibold text-white hover:bg-white/[0.08]"
            >
              {isAnyLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 motion-safe:animate-spin" />
                  Loading years
                </>
              ) : (
                <>
                  Load years down to {nextEndYear}
                  <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Checked {scanLimit} of {ALL_YEARS.length} years
            </p>
          </div>
        )}
      </main>
    </div>
  );
}