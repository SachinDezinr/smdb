import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  ChevronDown,
  Film,
  Globe,
  Heart,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tv,
  type LucideIcon,
} from 'lucide-react';
import { Navigation } from '@/components/layout/Navigation';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { ContentCard } from '@/components/content/ContentCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ContentItem } from '@/lib/tmdb/types';
import { fetchBestOfYear } from '@/lib/tmdb/queries';
import { MOVIE_GENRES, TV_GENRES, COMMON_GENRES, type GenreOption } from '@/lib/tmdb/genres';

/* ------------------------------------------------------------------ */
/* Types and constants                                                 */
/* ------------------------------------------------------------------ */

export type RecommendationCategory = 'movie' | 'tv' | 'kdrama' | 'anime';
export type RecommendationRegion = 'all' | 'hollywood' | 'bollywood' | 'pollywood' | 'tollywood';

type Filters = {
  category: RecommendationCategory;
  region: RecommendationRegion;
  genre: string;
};

type YearResult =
  | { status: 'loading' }
  | { status: 'done'; item: ContentItem | null }
  | { status: 'error' };

const DEFAULT_FILTERS: Filters = { category: 'movie', region: 'all', genre: 'all' };

const START_YEAR = new Date().getFullYear();
const END_YEAR = 1950;
const ALL_YEARS: number[] = Array.from({ length: START_YEAR - END_YEAR + 1 }, (_, i) => START_YEAR - i);
const INITIAL_YEARS = 15;
const STEP_YEARS = 12;

const CATEGORY_OPTIONS: { id: RecommendationCategory; label: string; icon: LucideIcon }[] = [
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv', label: 'Series / Shows', icon: Tv },
  { id: 'kdrama', label: 'K-Drama', icon: Heart },
  { id: 'anime', label: 'Anime', icon: Sparkles },
];

const REGION_OPTIONS: { id: RecommendationRegion; label: string; flag: string }[] = [
  { id: 'all', label: 'All regions', flag: '🌐' },
  { id: 'hollywood', label: 'Hollywood (English)', flag: '🇺🇸' },
  { id: 'bollywood', label: 'Bollywood (Hindi)', flag: '🇮🇳' },
  { id: 'tollywood', label: 'Tollywood (Telugu)', flag: '🇮🇳' },
  { id: 'pollywood', label: 'Pollywood (Punjabi)', flag: '🇮🇳' },
];

const NATIVE_REGION: Partial<Record<RecommendationCategory, string>> = {
  kdrama: '🇰🇷 Native: South Korea',
  anime: '🇯🇵 Native: Japan',
};

const INDIAN_REGIONS: RecommendationRegion[] = ['bollywood', 'pollywood', 'tollywood'];
const WESTERN_ID = 37;
const NEWS_ID = 10763;

/* ------------------------------------------------------------------ */
/* Filter rules                                                        */
/* ------------------------------------------------------------------ */

// Region only applies to Movies and Series. K-Drama and Anime are region-specific already.
const hasRegionFilter = (category: RecommendationCategory) =>
  category === 'movie' || category === 'tv';

function getGenres(category: RecommendationCategory, region: RecommendationRegion): GenreOption[] {
  const base =
    category === 'movie' ? MOVIE_GENRES
    : category === 'tv' || category === 'kdrama' ? TV_GENRES
    : COMMON_GENRES;

  const trim = INDIAN_REGIONS.includes(region) || category === 'kdrama' || category === 'anime';

  return base.filter((g) => {
    if (String(g.id) === 'all') return false; // the dropdown adds its own "All genres"
    if (!trim) return true;
    return Number(g.id) !== WESTERN_ID && Number(g.id) !== NEWS_ID && !/western|news/i.test(g.name);
  });
}

// Run on every filter change so the state is never invalid.
function normalizeFilters(f: Filters): Filters {
  const region = hasRegionFilter(f.category) ? f.region : 'all';
  const genreIsValid =
    f.genre === 'all' || getGenres(f.category, region).some((g) => String(g.id) === f.genre);
  return { category: f.category, region, genre: genreIsValid ? f.genre : 'all' };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const isUpcoming = (value?: string | null) => !!value && new Date(value).getTime() > Date.now();

// Calls onVisible when the returned element gets close to the screen.
function useOnVisible(onVisible: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible();
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, enabled]);

  return ref;
}

/* ------------------------------------------------------------------ */
/* Data hook: all loading logic                                        */
/* ------------------------------------------------------------------ */

const LOADING: YearResult = { status: 'loading' };

function useBestOfYears({ category, region, genre }: Filters, count: number) {
  // Keyed by filters + year, so old requests can never overwrite new results.
  const [results, setResults] = useState<Record<string, YearResult>>({});
  const requested = useRef(new Set<string>());

  const keyFor = useCallback(
    (year: number) => `${category}|${region}|${genre}|${year}`,
    [category, region, genre]
  );

  const load = useCallback(
    (year: number) => {
      const key = keyFor(year);
      if (requested.current.has(key)) return;
      requested.current.add(key);

      fetchBestOfYear(year, category, genre, region)
        .then((item) => setResults((prev) => ({ ...prev, [key]: { status: 'done', item } })))
        .catch((err) => {
          console.error(`Failed to load ${year}:`, err);
          setResults((prev) => ({ ...prev, [key]: { status: 'error' } }));
        });
    },
    [category, region, genre, keyFor]
  );

  useEffect(() => {
    ALL_YEARS.slice(0, count).forEach(load);
  }, [count, load]);

  const retry = useCallback(
    (year: number) => {
      const key = keyFor(year);
      requested.current.delete(key);
      setResults((prev) => ({ ...prev, [key]: LOADING }));
      load(year);
    },
    [keyFor, load]
  );

  // Years that finished with no result are hidden.
  const rows = useMemo(
    () =>
      ALL_YEARS.slice(0, count)
        .map((year) => ({ year, result: results[keyFor(year)] ?? LOADING }))
        .filter(({ result }) => !(result.status === 'done' && result.item === null)),
    [count, results, keyFor]
  );

  const isLoading = rows.some(({ result }) => result.status === 'loading');

  return { rows, isLoading, retry };
}

/* ------------------------------------------------------------------ */
/* Filter bar                                                          */
/* ------------------------------------------------------------------ */

const triggerClass =
  'h-10 w-full rounded-xl border-white/10 bg-white/[0.04] text-sm text-white hover:border-white/20 focus:ring-primary/40 lg:w-48';
const contentClass = 'max-h-72 rounded-xl border-white/10 bg-neutral-900 text-white';

type FilterBarProps = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
};

const FilterBar = memo(function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  const { category, region, genre } = filters;
  const genres = useMemo(() => getGenres(category, region), [category, region]);
  const isDefault =
    category === DEFAULT_FILTERS.category &&
    region === DEFAULT_FILTERS.region &&
    genre === DEFAULT_FILTERS.genre;

  return (
    <div className="sticky top-2 z-30 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-background/80 p-3 backdrop-blur-xl sm:grid-cols-3 lg:flex lg:items-center">
      {/* Format */}
      <Select
        value={category}
        onValueChange={(val) => onChange({ category: val as RecommendationCategory })}
      >
        <SelectTrigger aria-label="Format" className={triggerClass}>
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {CATEGORY_OPTIONS.map(({ id, label, icon: Icon }) => (
            <SelectItem key={id} value={id}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Region */}
      {hasRegionFilter(category) ? (
        <Select value={region} onValueChange={(val) => onChange({ region: val as RecommendationRegion })}>
          <SelectTrigger aria-label="Region" className={triggerClass}>
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent className={contentClass}>
            {REGION_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <span className="mr-2">{opt.flag}</span>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex h-10 items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 text-xs text-muted-foreground lg:w-48">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{NATIVE_REGION[category]}</span>
        </div>
      )}

      {/* Genre */}
      <Select value={genre} onValueChange={(val) => onChange({ genre: val })}>
        <SelectTrigger aria-label="Genre" className={cn(triggerClass, 'col-span-2 sm:col-span-1')}>
          <SelectValue placeholder="All genres" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          <SelectItem value="all">All genres</SelectItem>
          {genres.map((g) => (
            <SelectItem key={g.id} value={String(g.id)}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!isDefault && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="col-span-2 text-muted-foreground hover:text-primary sm:col-span-3 lg:col-span-1 lg:ml-auto"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
        </Button>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Year row                                                            */
/* ------------------------------------------------------------------ */

const chip = 'rounded-md px-2.5 py-0.5 text-xs font-semibold';
const cardShell = 'grid gap-5 rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-[180px_1fr] sm:p-5';

function RowSkeleton({ year }: { year: number }) {
  return (
    <div role="status" className={cn(cardShell, 'animate-pulse')}>
      <span className="sr-only">Loading the best pick for {year}</span>
      <div className="mx-auto aspect-[2/3] w-full max-w-[180px] rounded-2xl bg-white/[0.06] sm:mx-0" />
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-white/[0.06]" />
        <div className="h-7 w-2/3 rounded bg-white/[0.06]" />
        <div className="h-3 w-full rounded bg-white/[0.06]" />
        <div className="h-3 w-5/6 rounded bg-white/[0.06]" />
        <div className="h-3 w-4/6 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

function Showcase({ item, year }: { item: ContentItem; year: number }) {
  return (
    <article className={cn(cardShell, 'transition-colors hover:border-white/20')}>
      <div className="mx-auto w-full max-w-[180px] sm:mx-0">
        <ContentCard item={item} />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(chip, 'bg-white/[0.08] text-white')}>
            {item.media_type === 'movie' ? 'Film' : 'Series'}
          </span>
          {item.rating > 0 && (
            <span className={cn(chip, 'flex items-center gap-1 border border-primary/30 bg-primary/15 text-primary')}>
              <Star className="h-3 w-3 fill-primary" />
              {item.rating.toFixed(1)}
            </span>
          )}
          {item.vote_count ? (
            <span className="text-xs text-muted-foreground">{item.vote_count.toLocaleString()} TMDB votes</span>
          ) : null}
          {isUpcoming(item.release_date) && (
            <span className={cn(chip, 'border border-blue-500/20 bg-blue-500/10 text-blue-400')}>Upcoming</span>
          )}
        </div>

        <h3 className="text-xl font-bold leading-snug text-white sm:text-2xl">{item.title}</h3>

        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {item.overview || 'No synopsis available for this title.'}
        </p>

        <p className="mt-auto border-t border-white/10 pt-3 justify-end text-xs text-muted-foreground">
          <span className="font-semibold text-neutral-300">Released </span>
          {formatDate(item.release_date) ?? year}
        </p>
      </div>
    </article>
  );
}

type YearRowProps = {
  year: number;
  result: YearResult;
  onRetry: (year: number) => void;
};

const YearRow = memo(function YearRow({ year, result, onRetry }: YearRowProps) {
  if (result.status === 'done' && !result.item) return null;

  return (
    <section
      aria-labelledby={`year-${year}`}
      className="grid gap-3 border-t border-white/10 py-8 first:border-t-0 md:grid-cols-[8rem_1fr] md:gap-8"
    >
      <div className="self-start md:sticky md:top-24">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Best of</p>
        <h2 id={`year-${year}`} className="text-5xl font-black tabular-nums tracking-tighter text-white md:text-6xl">
          {year}
        </h2>
      </div>

      {result.status === 'loading' && <RowSkeleton year={year} />}

      {result.status === 'error' && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm"
        >
          <p className="text-red-300">Could not load {year}.</p>
          <Button size="sm" variant="outline" onClick={() => onRetry(year)}>
            Retry
          </Button>
        </div>
      )}

      {result.status === 'done' && result.item && <Showcase item={result.item} year={year} />}
    </section>
  );
});

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Recommendations() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [count, setCount] = useState(INITIAL_YEARS);

  const { rows, isLoading, retry } = useBestOfYears(filters, count);
  const hasMore = count < ALL_YEARS.length;

  const handleChange = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => normalizeFilters({ ...prev, ...patch }));
    setCount(INITIAL_YEARS);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCount(INITIAL_YEARS);
  }, []);

  const loadMore = useCallback(() => setCount((c) => Math.min(c + STEP_YEARS, ALL_YEARS.length)), []);

  // Auto-load only after something is showing, so an empty filter
  // does not silently scan all the way back to 1950.
  const sentinelRef = useOnVisible(loadMore, hasMore && !isLoading && rows.length > 0);

  const nextYear = ALL_YEARS[Math.min(count + STEP_YEARS, ALL_YEARS.length) - 1];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      <ScrollToTop />

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-28 sm:p-6 md:p-8 lg:p-12 lg:pb-16">
        <header className="mb-6">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Award size={14} /> Hall of Fame
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Recommendations{' '}
            <span className="text-primary">
              {START_YEAR}–{END_YEAR}
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            One top-rated pick for every year, newest first. Change a filter and the list updates.
          </p>
        </header>

        <FilterBar filters={filters} onChange={handleChange} onReset={handleReset} />

        <div className="mt-4">
          {rows.map(({ year, result }) => (
            <YearRow key={year} year={year} result={result} onRetry={retry} />
          ))}
        </div>

        {!isLoading && rows.length === 0 && (
          <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-60" />
            <h3 className="mb-1 text-lg font-bold text-white">No matching titles found</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Nothing matched this mix of format, region and genre in the years scanned so far.
              Try &quot;All genres&quot;, reset the filters, or search older years.
            </p>
            <Button onClick={handleReset} className="rounded-xl bg-primary font-bold text-black hover:bg-primary/90">
              Reset filters
            </Button>
          </div>
        )}

        {hasMore ? (
          <div ref={sentinelRef} className="py-10 text-center">
            {!isLoading && (
              <Button variant="outline" onClick={loadMore} className="rounded-xl">
                Load older years (down to {nextYear})
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          rows.length > 0 && (
            <p className="py-10 text-center text-xs text-muted-foreground">
              That is every year back to {END_YEAR}.
            </p>
          )
        )}
      </main>
    </div>
  );
}