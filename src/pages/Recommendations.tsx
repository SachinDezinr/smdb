import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

import { ContentItem } from '@/lib/tmdb/types';
import { fetchBestOfYear } from '@/lib/tmdb/queries';

import {
  MOVIE_GENRES,
  TV_GENRES,
  COMMON_GENRES,
  GenreOption,
} from '@/lib/tmdb/genres';

import {
  Award,
  Clapperboard,
  Flame,
  Globe2,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ==========================================================================
   TYPES
   ========================================================================== */

export type RecommendationCategory =
  | 'movie'
  | 'tv'
  | 'kdrama'
  | 'anime';

export type RecommendationRegion =
  | 'all'
  | 'hollywood'
  | 'bollywood'
  | 'pollywood'
  | 'tollywood';

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const CURRENT_YEAR = new Date().getFullYear();

const MIN_YEAR = 1950;
const MAX_YEAR = 2026;

const ALL_YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, index) => MAX_YEAR - index
);

const INITIAL_YEARS_COUNT = 15;
const STEP_YEARS_COUNT = 12;

/*
 * Maximum number of TMDB/API requests running simultaneously.
 *
 * 4 is a good balance:
 * - Faster than sequential requests
 * - Much safer than 15–77 simultaneous requests
 */
const MAX_CONCURRENT_REQUESTS = 4;

/*
 * Cache lifetime.
 *
 * Increase this if your recommendations don't change frequently.
 */
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const REGION_OPTIONS: {
  id: RecommendationRegion;
  label: string;
  flag: string;
}[] = [
  {
    id: 'all',
    label: 'All Industries',
    flag: '🌐',
  },
  {
    id: 'hollywood',
    label: 'Hollywood',
    flag: '🇺🇸',
  },
  {
    id: 'bollywood',
    label: 'Bollywood',
    flag: '🇮🇳',
  },
  {
    id: 'tollywood',
    label: 'Tollywood',
    flag: '🇮🇳',
  },
  {
    id: 'pollywood',
    label: 'Pollywood',
    flag: '🇮🇳',
  },
];

const SELECT_TRIGGER =
  'h-11 w-full rounded-xl border-white/10 bg-white/[0.045] ' +
  'text-white shadow-none transition-all duration-200 ' +
  'hover:border-white/20 hover:bg-white/[0.07] ' +
  'focus:ring-2 focus:ring-primary/20';

const SELECT_CONTENT =
  'rounded-xl border-white/10 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-xl';

const SELECT_ITEM =
  'cursor-pointer rounded-lg focus:bg-white/10 focus:text-white';

/* ==========================================================================
   CACHE
   ========================================================================== */

type CacheEntry = {
  item: ContentItem | null;
  timestamp: number;
};

/*
 * Module-level cache.

 * This survives component re-renders and also survives unmount/remount
 * while the SPA is running.
 *
 * Key example:
 *
 * movie|all|28|2024
 * tv|hollywood|18|2019
 */
const recommendationCache = new Map<string, CacheEntry>();

function createCacheKey(
  year: number,
  category: RecommendationCategory,
  genre: string,
  region: RecommendationRegion
) {
  return `${category}|${region}|${genre}|${year}`;
}

function getCachedRecommendation(
  key: string
): ContentItem | null | undefined {
  const cached = recommendationCache.get(key);

  if (!cached) {
    return undefined;
  }

  const isExpired =
    Date.now() - cached.timestamp > CACHE_TTL;

  if (isExpired) {
    recommendationCache.delete(key);
    return undefined;
  }

  return cached.item;
}

function setCachedRecommendation(
  key: string,
  item: ContentItem | null
) {
  recommendationCache.set(key, {
    item,
    timestamp: Date.now(),
  });
}

/* ==========================================================================
   REQUEST QUEUE
   ========================================================================== */

/*
 * Small concurrency limiter.
 *
 * Instead of:
 *
 * Promise.all(15 requests)
 *
 * we do:
 *
 * 4 requests
 * ↓
 * next 4
 * ↓
 * next 4
 *
 * This significantly reduces API pressure.
 */

type QueueTask<T> = () => Promise<T>;

class RequestQueue {
  private active = 0;

  private queue: Array<{
    task: QueueTask<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(private readonly concurrency: number) {}

  add<T>(task: QueueTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.process();
    });
  }

  private process() {
    while (
      this.active < this.concurrency &&
      this.queue.length > 0
    ) {
      const entry = this.queue.shift();

      if (!entry) return;

      this.active++;

      entry.task()
        .then(entry.resolve)
        .catch(entry.reject)
        .finally(() => {
          this.active--;
          this.process();
        });
    }
  }

  clear() {
    /*
     * We intentionally don't reject queued requests here.
     *
     * Stale requests are ignored by the component using requestId.
     * This prevents unhandled promise rejections.
     */
  }
}

const recommendationQueue = new RequestQueue(
  MAX_CONCURRENT_REQUESTS
);

/* ==========================================================================
   UI COMPONENTS
   ========================================================================== */

function FilterLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </label>
  );
}

function LoadingState({ year }: { year: number }) {
  return (
    <div className="flex min-h-[210px] flex-col items-center justify-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-foreground/80">
          Finding the best title
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Searching {year}
        </p>
      </div>
    </div>
  );
}

function YearBadge({ year }: { year: number }) {
  const isFuture = year > CURRENT_YEAR;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
        'text-[10px] font-semibold uppercase tracking-wide',
        isFuture
          ? 'border-blue-400/20 bg-blue-400/10 text-blue-400'
          : 'border-primary/20 bg-primary/10 text-primary',
      ].join(' ')}
    >
      {isFuture ? (
        <>
          <Flame className="h-3 w-3" />
          Anticipated
        </>
      ) : (
        <>
          <Award className="h-3 w-3" />
          Best of {year}
        </>
      )}
    </span>
  );
}

function RatingBadge({
  item,
}: {
  item: ContentItem;
}) {
  if (!item.rating || item.rating <= 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
      <Star className="h-3 w-3 fill-current" />
      {item.rating.toFixed(1)}
    </span>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr] lg:grid-cols-[210px_1fr]">
      <div className="mx-auto h-[270px] w-full max-w-[180px] animate-pulse rounded-2xl bg-white/[0.06] sm:mx-0" />

      <div className="space-y-4 py-2">
        <div className="h-5 w-32 animate-pulse rounded bg-white/[0.07]" />

        <div className="h-8 w-3/4 animate-pulse rounded bg-white/[0.07]" />

        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
          <div className="h-3 w-[90%] animate-pulse rounded bg-white/[0.05]" />
          <div className="h-3 w-[75%] animate-pulse rounded bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function Recommendations() {
  const [category, setCategory] =
    useState<RecommendationCategory>('movie');

  const [region, setRegion] =
    useState<RecommendationRegion>('all');

  const [selectedGenre, setSelectedGenre] =
    useState<string>('all');

  const [scanLimit, setScanLimit] = useState(
    INITIAL_YEARS_COUNT
  );

  const [yearData, setYearData] = useState<
    Record<number, ContentItem | null>
  >({});

  const [loadingYears, setLoadingYears] = useState<
    Record<number, boolean>
  >({});

  /*
   * Every filter combination gets a new request ID.
   *
   * Example:
   *
   * User selects Movie
   * ↓
   * requests start
   *
   * User immediately selects Anime
   * ↓
   * requestId changes
   *
   * Old Movie responses are ignored.
   */
  const requestIdRef = useRef(0);

  /*
   * Prevent duplicate requests during the same render cycle.
   */
  const requestedKeysRef = useRef(
    new Set<string>()
  );

  /* ========================================================================
     AVAILABLE GENRES
     ======================================================================== */

  const availableGenres = useMemo<GenreOption[]>(() => {
    let genres: GenreOption[];

    switch (category) {
      case 'movie':
        genres = MOVIE_GENRES;
        break;

      case 'tv':
      case 'kdrama':
        genres = TV_GENRES;
        break;

      default:
        genres = COMMON_GENRES;
    }

    const isIndianRegion =
      region === 'bollywood' ||
      region === 'tollywood' ||
      region === 'pollywood';

    const shouldRemoveGenres =
      isIndianRegion ||
      category === 'kdrama' ||
      category === 'anime';

    if (!shouldRemoveGenres) {
      return genres;
    }

    return genres.filter((genre) => {
      const name = genre.name.toLowerCase();

      return (
        genre.id !== 37 &&
        genre.id !== 10763 &&
        !name.includes('western') &&
        !name.includes('news')
      );
    });
  }, [category, region]);

  /* ========================================================================
     RESET INVALID GENRE
     ======================================================================== */

  useEffect(() => {
    if (
      selectedGenre !== 'all' &&
      !availableGenres.some(
        (genre) =>
          String(genre.id) ===
          String(selectedGenre)
      )
    ) {
      setSelectedGenre('all');
    }
  }, [availableGenres, selectedGenre]);

  /* ========================================================================
     SCANNED YEARS
     ======================================================================== */

  const scannedYears = useMemo(
    () => ALL_YEARS.slice(0, scanLimit),
    [scanLimit]
  );

  /* ========================================================================
     LOAD SINGLE YEAR
     ======================================================================== */

  const loadYear = useCallback(
    async (
      year: number,
      currentCategory: RecommendationCategory,
      genre: string,
      currentRegion: RecommendationRegion,
      requestId: number
    ) => {
      const cacheKey = createCacheKey(
        year,
        currentCategory,
        genre,
        currentRegion
      );

      /*
       * Check cache first.
       */
      const cached =
        getCachedRecommendation(cacheKey);

      if (cached !== undefined) {
        /*
         * Ignore cached result if user changed filters.
         */
        if (requestId !== requestIdRef.current) {
          return;
        }

        setYearData((previous) => ({
          ...previous,
          [year]: cached,
        }));

        return;
      }

      /*
       * Prevent duplicate requests.
       */
      if (requestedKeysRef.current.has(cacheKey)) {
        return;
      }

      requestedKeysRef.current.add(cacheKey);

      /*
       * Show loading state.
       */
      if (requestId === requestIdRef.current) {
        setLoadingYears((previous) => ({
          ...previous,
          [year]: true,
        }));
      }

      try {
        /*
         * Queue controls concurrency.
         */
        const item = await recommendationQueue.add(
          () =>
            fetchBestOfYear(
              year,
              currentCategory,
              genre,
              currentRegion
            )
        );

        /*
         * Store result in cache regardless of whether
         * the component still needs it.
         */
        setCachedRecommendation(
          cacheKey,
          item
        );

        /*
         * IMPORTANT:
         *
         * If filters changed while the request was
         * running, don't put the old result into state.
         */
        if (requestId !== requestIdRef.current) {
          return;
        }

        setYearData((previous) => ({
          ...previous,
          [year]: item,
        }));
      } catch (error) {
        console.error(
          `Failed to load recommendation for ${year}:`,
          error
        );

        /*
         * Don't overwrite a newer filter state.
         */
        if (requestId !== requestIdRef.current) {
          return;
        }

        setYearData((previous) => ({
          ...previous,
          [year]: null,
        }));
      } finally {
        requestedKeysRef.current.delete(cacheKey);

        if (requestId === requestIdRef.current) {
          setLoadingYears((previous) => ({
            ...previous,
            [year]: false,
          }));
        }
      }
    },
    []
  );

  /* ========================================================================
     FILTER CHANGE
     ======================================================================== */

  useEffect(() => {
    /*
     * Every filter combination gets a new request generation.
     */
    requestIdRef.current += 1;

    /*
     * Clear visible results.
     */
    setYearData({});

    setLoadingYears({});

    /*
     * New filter = start from newest years again.
     */
    setScanLimit(INITIAL_YEARS_COUNT);

    /*
     * Don't clear the actual cache.
     *
     * This is intentional.
     *
     * If the user switches:
     *
     * Movie → Anime → Movie
     *
     * previously fetched Movie results can be reused.
     */
  }, [category, region, selectedGenre]);

  /* ========================================================================
     LOAD CURRENT YEARS
     ======================================================================== */

  useEffect(() => {
    const requestId = requestIdRef.current;

    /*
     * Only request years that are actually visible.
     */
    scannedYears.forEach((year) => {
      const cacheKey = createCacheKey(
        year,
        category,
        selectedGenre,
        region
      );

      /*
       * Cached data can immediately populate the UI.
       */
      const cached =
        getCachedRecommendation(cacheKey);

      if (cached !== undefined) {
        setYearData((previous) => {
          /*
           * Avoid unnecessary state update.
           */
          if (
            previous[year] === cached
          ) {
            return previous;
          }

          return {
            ...previous,
            [year]: cached,
          };
        });

        return;
      }

      /*
       * Already loaded.
       */
      if (yearData[year] !== undefined) {
        return;
      }

      /*
       * Already loading.
       */
      if (loadingYears[year]) {
        return;
      }

      /*
       * Already queued/running.
       */
      if (
        requestedKeysRef.current.has(
          cacheKey
        )
      ) {
        return;
      }

      loadYear(
        year,
        category,
        selectedGenre,
        region,
        requestId
      );
    });
  }, [
    scannedYears,
    category,
    selectedGenre,
    region,
    yearData,
    loadingYears,
    loadYear,
  ]);

  /* ========================================================================
     VISIBLE ENTRIES
     ======================================================================== */

  const visibleEntries = useMemo(() => {
    return scannedYears
      .map((year) => ({
        year,
        item: yearData[year],
        loading:
          loadingYears[year] ||
          yearData[year] === undefined,
      }))
      .filter(
        ({ item, loading }) =>
          loading || item !== null
      );
  }, [
    scannedYears,
    yearData,
    loadingYears,
  ]);

  /* ========================================================================
     LOADING STATUS
     ======================================================================== */

  const isLoading = useMemo(
    () =>
      scannedYears.some(
        (year) =>
          loadingYears[year] ||
          yearData[year] === undefined
      ),
    [
      scannedYears,
      loadingYears,
      yearData,
    ]
  );

  const showRegionFilter =
    category === 'movie' ||
    category === 'tv';

  const hasActiveFilters =
    category !== 'movie' ||
    region !== 'all' ||
    selectedGenre !== 'all';

  /* ========================================================================
     ACTIONS
     ======================================================================== */

  const handleLoadMore = useCallback(() => {
    setScanLimit((previous) =>
      Math.min(
        previous + STEP_YEARS_COUNT,
        ALL_YEARS.length
      )
    );
  }, []);

  const handleReset = useCallback(() => {
    setCategory('movie');
    setRegion('all');
    setSelectedGenre('all');
  }, []);

  /* ========================================================================
     RENDER
     ======================================================================== */

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 md:px-8 lg:px-10 lg:pb-16">

        {/* ================================================================
            HERO
        ================================================================ */}

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-primary/[0.12] via-background to-background p-5 shadow-2xl sm:p-7">

          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-purple-500/[0.06] blur-3xl" />

          <div className="relative">

            {/* Header */}

            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                  <Award className="h-3 w-3" />
                  Hall of Fame
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Recommendations

                  <span className="ml-2 text-primary">
                    2026–1950
                  </span>
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Discover highly rated movies and
                  shows, organized year by year from
                  newest to oldest.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground lg:flex">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Smart recommendations
              </div>

            </div>

            {/* ============================================================
                FILTERS
            ============================================================ */}

            <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-3 sm:p-4">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {/* Format */}

                <div className="space-y-2">

                  <FilterLabel
                    icon={
                      <Clapperboard className="h-3.5 w-3.5" />
                    }
                  >
                    Format
                  </FilterLabel>

                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setCategory(
                        value as RecommendationCategory
                      )
                    }
                  >
                    <SelectTrigger
                      className={SELECT_TRIGGER}
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent
                      className={SELECT_CONTENT}
                    >
                      <SelectItem
                        value="movie"
                        className={SELECT_ITEM}
                      >
                        🎬 Movie
                      </SelectItem>

                      <SelectItem
                        value="tv"
                        className={SELECT_ITEM}
                      >
                        📺 Series / Shows
                      </SelectItem>

                      <SelectItem
                        value="kdrama"
                        className={SELECT_ITEM}
                      >
                        🇰🇷 K-Drama
                      </SelectItem>

                      <SelectItem
                        value="anime"
                        className={SELECT_ITEM}
                      >
                        ⚡ Anime
                      </SelectItem>
                    </SelectContent>
                  </Select>

                </div>

                {/* Region */}

                <div className="space-y-2">

                  <FilterLabel
                    icon={
                      <Globe2 className="h-3.5 w-3.5" />
                    }
                  >
                    Region / Industry
                  </FilterLabel>

                  {showRegionFilter ? (
                    <Select
                      value={region}
                      onValueChange={(value) =>
                        setRegion(
                          value as RecommendationRegion
                        )
                      }
                    >
                      <SelectTrigger
                        className={SELECT_TRIGGER}
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent
                        className={SELECT_CONTENT}
                      >
                        {REGION_OPTIONS.map(
                          (option) => (
                            <SelectItem
                              key={option.id}
                              value={option.id}
                              className={SELECT_ITEM}
                            >
                              <span className="mr-2">
                                {option.flag}
                              </span>

                              {option.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex h-11 items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-sm text-muted-foreground">
                      {category === 'kdrama'
                        ? '🇰🇷 South Korea'
                        : '🇯🇵 Japan'}
                    </div>
                  )}

                </div>

                {/* Genre */}

                <div className="space-y-2">

                  <div className="flex items-center justify-between">

                    <FilterLabel
                      icon={
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      }
                    >
                      Genre
                    </FilterLabel>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    )}

                  </div>

                  <Select
                    value={selectedGenre}
                    onValueChange={setSelectedGenre}
                  >
                    <SelectTrigger
                      className={SELECT_TRIGGER}
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent
                      className={`${SELECT_CONTENT} max-h-80`}
                    >
                      <SelectItem
                        value="all"
                        className={SELECT_ITEM}
                      >
                        All Genres
                      </SelectItem>

                      {availableGenres.map(
                        (genre) => (
                          <SelectItem
                            key={genre.id}
                            value={String(
                              genre.id
                            )}
                            className={SELECT_ITEM}
                          >
                            {genre.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            RESULTS HEADER
        ================================================================ */}

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-lg font-bold">
              Top picks
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {category === 'movie'
                ? 'Movies'
                : category === 'tv'
                  ? 'Series & shows'
                  : category === 'kdrama'
                    ? 'K-Dramas'
                    : 'Anime'}

              {' · '}

              {selectedGenre === 'all'
                ? 'All genres'
                : availableGenres.find(
                    (genre) =>
                      String(genre.id) ===
                      String(selectedGenre)
                  )?.name}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Updating
            </div>
          )}

        </div>

        {/* ================================================================
            YEAR FEED
        ================================================================ */}

        <div className="space-y-5">

          {visibleEntries.map(
            ({ year, item, loading }, index) => {

              return (
                <article
                  key={year}
                  id={`year-card-${year}`}
                  className="group overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025] transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
                >

                  {/* Year header */}

                  <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4 sm:px-6">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-primary">
                          #
                        </span>

                        <span className="text-2xl font-black tracking-tight sm:text-3xl">
                          {year}
                        </span>
                      </div>

                      <YearBadge year={year} />

                    </div>

                    <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
                      {String(index + 1).padStart(
                        2,
                        '0'
                      )}
                    </span>

                  </div>

                  {/* Content */}

                  <div className="p-4 sm:p-6">

                    {loading ? (
                      <LoadingState year={year} />
                    ) : item ? (

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr] lg:grid-cols-[210px_1fr]">

                        {/* Poster */}

                        <div className="mx-auto w-full max-w-[180px] sm:mx-0 lg:max-w-[210px]">
                          <ContentCard item={item} />
                        </div>

                        {/* Details */}

                        <div className="flex min-w-0 flex-col justify-between">

                          <div>

                            {/* Metadata */}

                            <div className="mb-3 flex flex-wrap items-center gap-2">

                              <span className="rounded-lg bg-white/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {item.media_type ===
                                'movie'
                                  ? 'Feature Film'
                                  : 'Series / Show'}
                              </span>

                              <RatingBadge
                                item={item}
                              />

                              {!!item.vote_count && (
                                <span className="text-[10px] text-muted-foreground">
                                  {item.vote_count.toLocaleString()}{' '}
                                  votes
                                </span>
                              )}

                            </div>

                            {/* Title */}

                            <h3 className="max-w-3xl text-xl font-black leading-tight tracking-tight sm:text-2xl lg:text-3xl">
                              {item.title}
                            </h3>

                            {/* Overview */}

                            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground line-clamp-4">
                              {item.overview ||
                                'No detailed synopsis is available for this title.'}
                            </p>

                          </div>

                          {/* Bottom metadata */}

                          <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.07] pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">

                            <div className="text-muted-foreground">
                              <span className="font-semibold text-foreground/70">
                                Released
                              </span>{' '}
                              ·{' '}
                              {item.release_date ||
                                year}
                            </div>

                            <div className="inline-flex items-center gap-1.5 font-semibold text-primary">
                              <Sparkles className="h-3.5 w-3.5" />
                              Top pick for {year}
                            </div>

                          </div>

                        </div>
                      </div>

                    ) : (
                      <RecommendationSkeleton />
                    )}

                  </div>
                </article>
              );
            }
          )}

        </div>

        {/* ================================================================
            EMPTY STATE
        ================================================================ */}

        {!isLoading &&
          visibleEntries.length === 0 && (
            <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>

              <h3 className="text-lg font-bold">
                No matching titles
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Nothing matched the selected format,
                region, and genre. Try another filter
                combination.
              </p>

              <Button
                onClick={handleReset}
                className="mt-6 rounded-xl font-semibold"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset filters
              </Button>

            </div>
          )}

        {/* ================================================================
            LOAD MORE
        ================================================================ */}

        {scanLimit < ALL_YEARS.length && (
          <div className="mt-8 flex justify-center">

            <Button
              size="lg"
              disabled={isLoading}
              onClick={handleLoadMore}
              className="group h-12 rounded-2xl bg-primary px-7 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 disabled:opacity-50"
            >

              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load older years

                  <ChevronDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </>
              )}

            </Button>

          </div>
        )}

        {/* ================================================================
            END OF ARCHIVE
        ================================================================ */}

        {scanLimit >= ALL_YEARS.length &&
          !isLoading && (
            <div className="mt-10 flex items-center justify-center gap-3 text-xs text-muted-foreground">

              <div className="h-px w-12 bg-white/10" />

              <span>
                1950 · End of archive
              </span>

              <div className="h-px w-12 bg-white/10" />

            </div>
          )}

      </main>
    </div>
  );
}