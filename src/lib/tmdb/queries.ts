import { ContentItem, MediaType, Region } from './types';
import { fetchFromProxy, getActivityScore, ACTIVITY_THRESHOLD } from './client';
import { getRegionParams } from './regions';
import { mapResults, interleave, uniqueById, sortYearContent } from './mappers';

/* ------------------------------ shared helpers ------------------------------ */

type Params = Record<string, string | number | boolean | undefined>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawList = { results?: any[] };
/** ContentItem as declared in ./types doesn't list these fields, though mapResults fills them in at runtime. */
export type RatedContentItem = ContentItem & { rating?: number; vote_count?: number };
type Video = { site?: string; type?: string; official?: boolean; key?: string };

const VIDEO_LANGS = 'en,hi,te,ta,kn,ml,pa,ko,ja,null';
const INDIAN_LANGS = 'hi|te|ta|kn|ml';
const INDIAN_LANGS_WITH_PA = `${INDIAN_LANGS}|pa`;
const ANIME_KEYWORD = '210024';

const todayISO = () => new Date().toISOString().split('T')[0];

/** anime and k-drama are TV shows as far as TMDB is concerned */
const kindOf = (type: MediaType): 'movie' | 'tv' => (type === 'movie' ? 'movie' : 'tv');
const discoverPath = (type: MediaType) => `/discover/${kindOf(type)}`;

const DATE_KEYS = {
  movie: {
    year: 'primary_release_year',
    gte: 'primary_release_date.gte',
    lte: 'primary_release_date.lte',
    asc: 'primary_release_date.asc',
  },
  tv: {
    year: 'first_air_date_year',
    gte: 'first_air_date.gte',
    lte: 'first_air_date.lte',
    asc: 'first_air_date.asc',
  },
} as const;

const isReleased = (item: ContentItem, today: string) =>
  !item.release_date || item.release_date === 'TBA' || item.release_date <= today;

const timeOf = (item: ContentItem) =>
  item.release_date && item.release_date !== 'TBA' ? new Date(item.release_date).getTime() : 0;

/** One failing endpoint should not blank out the whole row/page. */
const safe = (p: Promise<RawList>): Promise<RawList> => p.catch(() => ({ results: [] }));

/** Applies the per-type language/keyword rules used by several fetchers. */
function applyTypeFilters(params: Params, type: MediaType): Params {
  const out = { ...params };
  if (type === 'tv') {
    out.without_original_language = 'ko|ja';
  } else if (type === 'anime') {
    delete out.without_original_language;
    out.with_keywords = ANIME_KEYWORD;
    out.with_original_language = 'ja';
  } else if (type === 'k-drama') {
    delete out.without_original_language;
    out.with_original_language = 'ko';
  }
  return out;
}

/** "All regions" view: Hollywood + Indian industries side by side, interleaved. */
async function fetchMixedDiscover(type: MediaType, params: Params): Promise<ContentItem[]> {
  const path = discoverPath(type);
  const [h, i] = await Promise.all([
    fetchFromProxy(path, { ...params, ...getRegionParams('hollywood') }),
    fetchFromProxy(path, { ...params, region: 'IN', with_original_language: INDIAN_LANGS_WITH_PA }),
  ]);
  return interleave(mapResults(h.results || [], type), mapResults(i.results || [], type));
}

const onlyTv = (items: ContentItem[], type: MediaType) =>
  type === 'tv' ? items.filter((i) => i.media_type === 'tv') : items;

/* ------------------------------ trending ------------------------------ */

export const fetchTrending = async (): Promise<ContentItem[]> => {
  const today = todayISO();

  // `append_to_response` only works on detail endpoints, so it is dropped from
  // list endpoints (it did nothing there except fragment cache keys).
  const [globalMovies, indianMovies, globalTv, anime, kdrama] = await Promise.all([
    safe(fetchFromProxy('/trending/movie/day')),
    safe(
      fetchFromProxy('/discover/movie', {
        region: 'IN',
        with_original_language: INDIAN_LANGS,
        sort_by: 'popularity.desc',
        include_adult: false,
      })
    ),
    safe(fetchFromProxy('/trending/tv/day', { without_original_language: 'ja|ko' })),
    safe(
      fetchFromProxy('/discover/tv', {
        with_keywords: ANIME_KEYWORD,
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
        include_adult: false,
      })
    ),
    safe(
      fetchFromProxy('/discover/tv', {
        with_original_language: 'ko',
        sort_by: 'popularity.desc',
        include_adult: false,
      })
    ),
  ]);

  const combined = interleave(
    mapResults(globalMovies.results || [], 'movie'),
    mapResults(indianMovies.results || [], 'movie'),
    mapResults(globalTv.results || [], 'tv').filter((i) => i.media_type === 'tv'),
    mapResults(anime.results || [], 'anime'),
    mapResults(kdrama.results || [], 'k-drama')
  ).filter((item) => isReleased(item, today));

  return uniqueById(combined).slice(0, 12);
};

/* ------------------------------ trailers ------------------------------ */

/** Lower is better: official trailer, trailer, teaser/clip/featurette, anything on YouTube. */
const videoRank = (v: Video) =>
  v.type === 'Trailer'
    ? v.official
      ? 0
      : 1
    : v.type === 'Teaser' || v.type === 'Clip' || v.type === 'Featurette'
      ? 2
      : 3;

const bestYouTubeKey = (videos: Video[]): string | null => {
  let best: Video | null = null;
  for (const v of videos) {
    if (v.site !== 'YouTube' || !v.key) continue;
    if (!best || videoRank(v) < videoRank(best)) best = v;
  }
  return best?.key ?? null;
};

export const fetchTrailers = async (
  id: number,
  type: MediaType,
  _title?: string
): Promise<string | null> => {
  const primary = kindOf(type);
  const alt = primary === 'movie' ? 'tv' : 'movie';
  const embed = (key: string) => `https://www.youtube.com/embed/${key}`;

  try {
    const data = await fetchFromProxy(`/${primary}/${id}/videos`, { include_video_language: VIDEO_LANGS });
    const key = bestYouTubeKey(data.results || []);
    if (key) return embed(key);

    // Some titles are filed under the other media type
    const altData = await fetchFromProxy(`/${alt}/${id}/videos`, {
      include_video_language: VIDEO_LANGS,
    }).catch(() => null);
    const altKey = bestYouTubeKey(altData?.results || []);
    if (altKey) return embed(altKey);
  } catch (err) {
    console.warn('[tmdb] Error fetching trailer videos:', err);
  }

  return null;
};

/* ------------------------------ browse / search ------------------------------ */

async function searchContent(query: string, page: number, type: MediaType): Promise<ContentItem[]> {
  const [multiData, personData] = await Promise.all([
    fetchFromProxy('/search/multi', { query, page, include_adult: false }),
    safe(fetchFromProxy('/search/person', { query, include_adult: false })),
  ]);

  let results = [...(multiData.results || [])];

  const personId = personData.results?.[0]?.id;
  if (personId) {
    const credits = await fetchFromProxy(`/person/${personId}/combined_credits`, {
      include_adult: false,
    }).catch(() => null);
    if (credits) {
      results = [
        ...results,
        ...(credits.cast || []),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(credits.crew || []).filter((c: any) => c.job === 'Director'),
      ];
    }
  }

  const q = query.toLowerCase();

  // Compute sort keys once instead of inside every comparison
  return uniqueById(mapResults(results, type))
    .map((item) => ({
      item,
      exact: item.title.toLowerCase() === q,
      time: timeOf(item),
    }))
    .sort(
      (a, b) =>
        Number(b.exact) - Number(a.exact) ||
        b.time - a.time ||
        (b.item.popularity || 0) - (a.item.popularity || 0)
    )
    .map((x) => x.item);
}

/**
 * Two filters (inside the target year / from the start of the target year on),
 * each sorted by popularity and by earliest date. A separate "date range" variant
 * used to be sent too, but it matched the year filter exactly, so it is gone.
 */
const FUTURE_YEAR_VARIANTS = (k: (typeof DATE_KEYS)['movie' | 'tv'], year: number): Params[] => [
  { [k.year]: year },
  { sort_by: k.asc, [k.year]: year },
  { [k.gte]: `${year}-01-01` },
  { sort_by: k.asc, [k.gte]: `${year}-01-01` },
];

export const fetchContent = async (
  type: MediaType,
  year?: number,
  page: number = 1,
  query: string = '',
  region: Region = 'all'
): Promise<ContentItem[]> => {
  if (query) return searchContent(query, page, type);

  const today = todayISO();
  const currentYear = new Date().getFullYear();
  const targetYear = year || currentYear;
  const isFutureYear = targetYear > currentYear;
  const keys = DATE_KEYS[kindOf(type)];

  const baseParams: Params = { page, include_adult: false, sort_by: 'popularity.desc' };
  if (!isFutureYear) {
    baseParams[keys.year] = targetYear;
    baseParams[keys.lte] = today;
  }
  if (type === 'tv') baseParams.without_original_language = 'ko|ja';

  let items: ContentItem[];

  if (!isFutureYear && region === 'all' && (type === 'movie' || type === 'tv')) {
    items = sortYearContent(uniqueById(await fetchMixedDiscover(type, baseParams)));
  } else {
    const path = discoverPath(type);
    const params = applyTypeFilters({ ...baseParams, ...getRegionParams(region) }, type);

    if (isFutureYear) {
      // Four distinct query shapes, run in parallel
      const responses = await Promise.all(
        FUTURE_YEAR_VARIANTS(keys, targetYear).map((v) => fetchFromProxy(path, { ...params, ...v }))
      );
      items = uniqueById(mapResults(responses.flatMap((r) => r.results || []), type));
    } else {
      const data = await fetchFromProxy(path, params);
      items = sortYearContent(uniqueById(mapResults(data.results || [], type)));
    }
  }

  if (!isFutureYear) items = items.filter((i) => isReleased(i, today));
  return onlyTv(items, type);
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/credits`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const director = data.crew?.find((c: any) => c.job === 'Director')?.name;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cast = data.cast?.slice(0, 5).map((c: any) => c.name);
  return { director, cast };
};

/* ------------------------------ upcoming ------------------------------ */

export const fetchUpcoming = async (
  type: MediaType = 'movie',
  region: Region = 'all',
  page: number = 1
): Promise<ContentItem[]> => {
  const keys = DATE_KEYS[kindOf(type)];
  const baseParams: Params = {
    page,
    include_adult: false,
    sort_by: keys.asc,
    [keys.gte]: todayISO(),
  };

  if (region === 'all' && (type === 'movie' || type === 'tv')) {
    const withTv = type === 'tv' ? { ...baseParams, without_original_language: 'ko|ja' } : baseParams;
    return onlyTv(uniqueById(await fetchMixedDiscover(type, withTv)), type);
  }

  const params = applyTypeFilters({ ...baseParams, ...getRegionParams(region) }, type);
  const data = await fetchFromProxy(discoverPath(type), params);
  return onlyTv(uniqueById(mapResults(data.results || [], type)), type);
};

/* ------------------------------ cache warming ------------------------------ */

export const smartWarmCache = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  if (conn && (conn.saveData || conn.effectiveType === '2g')) return;
  if (getActivityScore() < ACTIVITY_THRESHOLD) return;

  try {
    await Promise.all([fetchContent('movie', new Date().getFullYear()), fetchUpcoming('movie')]);
  } catch (err) {
    console.warn('[tmdb] Smart warming failed', err);
  }
};

/* ------------------------------ best of year ------------------------------ */

export type BestOfCategory = 'movie' | 'tv' | 'all' | 'kdrama' | 'anime';
export type BestOfRegion = 'all' | 'hollywood' | 'bollywood' | 'pollywood' | 'tollywood';

const BEST_OF_REGION_LANG: Record<Exclude<BestOfRegion, 'all'>, string> = {
  hollywood: 'en',
  bollywood: 'hi',
  pollywood: 'pa',
  tollywood: 'te',
};

/** Vote-count floor for a year, before niche/regional/genre relaxation. */
const baseMinVotes = (year: number, currentYear: number) =>
  year < 1980 ? 80 : year < 2000 ? 200 : year < 2020 ? 350 : year <= currentYear ? 150 : 0;

/** Everything fetchBestOfYear derives before calling TMDB. No network, easy to unit test. */
export function getBestOfYearConfig(
  year: number,
  category: BestOfCategory = 'all',
  genreId?: number | string,
  region: BestOfRegion = 'all'
) {
  const currentYear = new Date().getFullYear();
  const isFuture = year > currentYear;
  const hasGenre = !!genreId && genreId !== 'all';

  const regionParams: Params = {};
  if ((category === 'movie' || category === 'tv' || category === 'all') && region !== 'all') {
    regionParams.with_original_language = BEST_OF_REGION_LANG[region];
  }

  let minVotes = baseMinVotes(year, currentYear);
  if (region !== 'all' && region !== 'hollywood') {
    minVotes = Math.max(5, Math.floor(minVotes / 8));
  } else if (category === 'kdrama' || category === 'anime') {
    minVotes = Math.max(10, Math.floor(minVotes / 5));
  }
  if (hasGenre) minVotes = Math.max(10, Math.floor(minVotes / 3));

  const sortBy = isFuture ? 'popularity.desc' : 'vote_average.desc';

  return { isFuture, hasGenre, regionParams, minVotes, sortBy };
}

type BestOfConfig = ReturnType<typeof getBestOfYearConfig>;

/* ---- genre ids: TMDB uses different ids for movies and TV ---- */

const MOVIE_TO_TV: Record<string, string> = {
  '28': '10759', // Action          -> Action & Adventure
  '12': '10759', // Adventure       -> Action & Adventure
  '14': '10765', // Fantasy         -> Sci-Fi & Fantasy
  '878': '10765', // Science Fiction -> Sci-Fi & Fantasy
  '10752': '10768', // War          -> War & Politics
};
const TV_TO_MOVIE: Record<string, string[]> = {
  '10759': ['28', '12'],
  '10765': ['14', '878'],
  '10768': ['10752'],
};
const MOVIE_ONLY = new Set(['27', '10749', '53', '36', '10402', '10770']);
const TV_ONLY = new Set(['10762', '10763', '10764', '10766', '10767']);

/**
 * Translates a genre id into the id space of `kind`.
 * Returns null when that kind has no equivalent (e.g. Horror on TV), so the
 * caller can skip the request instead of sending a filter that matches nothing.
 * Shared ids (Drama, Comedy, Animation, ...) pass through unchanged.
 */
export function genreForKind(kind: 'movie' | 'tv', id: number | string): string | null {
  const g = String(id);
  if (kind === 'tv') {
    if (MOVIE_ONLY.has(g)) return null;
    return MOVIE_TO_TV[g] ?? g;
  }
  if (TV_ONLY.has(g)) return null;
  return TV_TO_MOVIE[g]?.[0] ?? g; // first match: TMDB can't mix AND and OR in one filter
}

/** Top discover result for one media kind. Returns null without a request if the genre doesn't exist for it. */
async function fetchTopOne(
  kind: 'movie' | 'tv',
  year: number,
  cfg: BestOfConfig,
  genreId: number | string | undefined,
  extra: Params = {},
  animation = false
): Promise<RatedContentItem | null> {
  const params: Params = {
    [DATE_KEYS[kind].year]: year,
    include_adult: false,
    sort_by: cfg.sortBy,
    page: 1,
    ...extra,
  };

  if (cfg.hasGenre) {
    const g = genreForKind(kind, genreId as number | string);
    if (g === null) return null;
    params.with_genres = animation ? `16,${g}` : g;
  } else if (animation) {
    params.with_genres = '16';
  }

  if (!cfg.isFuture && cfg.minVotes > 0) {
    // TV vote counts run lower than film, so the floor is halved
    params['vote_count.gte'] = kind === 'movie' ? cfg.minVotes : Math.floor(cfg.minVotes / 2);
  }

  const data = await fetchFromProxy(`/discover/${kind}`, params);
  return (mapResults(data.results || [], kind)[0] as RatedContentItem | undefined) ?? null;
}

const pickBetter = (
  m: RatedContentItem | null,
  t: RatedContentItem | null,
  movieWins: (m: RatedContentItem, t: RatedContentItem) => boolean
) => (!m ? t : !t ? m : movieWins(m, t) ? m : t);

const byRating = (m: RatedContentItem, t: RatedContentItem) => (m.rating || 0) >= (t.rating || 0);
const byVotes = (m: RatedContentItem, t: RatedContentItem) => (m.vote_count || 0) >= (t.vote_count || 0);
const blendedScore = (i: RatedContentItem) => (i.rating || 0) * 1000 + Math.min(i.vote_count || 0, 5000);
const byBlendedScore = (m: RatedContentItem, t: RatedContentItem) => blendedScore(m) >= blendedScore(t);

/* ---- concurrency cap: the page asks for many years at once ---- */

function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const pump = () => {
    while (active < max && queue.length) {
      active++;
      queue.shift()!();
    }
  };
  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            pump();
          });
      });
      pump();
    });
}

const bestOfLimit = createLimiter(4);

async function loadBestOfYear(
  year: number,
  category: BestOfCategory,
  genreId: number | string | undefined,
  region: BestOfRegion
): Promise<ContentItem | null> {
  const cfg = getBestOfYearConfig(year, category, genreId, region);

  try {
    switch (category) {
      case 'kdrama':
        return await fetchTopOne('tv', year, cfg, genreId, { ...cfg.regionParams, with_original_language: 'ko' });

      case 'anime': {
        const [m, t] = await Promise.all([
          fetchTopOne('movie', year, cfg, genreId, { with_original_language: 'ja' }, true),
          fetchTopOne('tv', year, cfg, genreId, { with_original_language: 'ja' }, true),
        ]);
        return pickBetter(m, t, byRating);
      }

      case 'movie':
        return await fetchTopOne('movie', year, cfg, genreId, cfg.regionParams);

      case 'tv':
        return await fetchTopOne('tv', year, cfg, genreId, cfg.regionParams);

      default: {
        const [m, t] = await Promise.all([
          fetchTopOne('movie', year, cfg, genreId, cfg.regionParams),
          fetchTopOne('tv', year, cfg, genreId, cfg.regionParams),
        ]);
        return pickBetter(m, t, cfg.isFuture ? byVotes : byBlendedScore);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch best of year ${year}:`, error);
    return null;
  }
}

/**
 * Best (highest rated, with a vote floor) movie or show for a year.
 * Future years sort by popularity instead. Supports movie, tv, kdrama, anime,
 * plus genre and region filters.
 *
 * Requests run through a small queue (4 at a time). Pass an AbortSignal to drop
 * queued work when the user changes filters; aborted calls resolve to null.
 */
export const fetchBestOfYear = (
  year: number,
  category: BestOfCategory = 'all',
  genreId?: number | string,
  region: BestOfRegion = 'all',
  signal?: AbortSignal
): Promise<ContentItem | null> =>
  bestOfLimit(async () => {
    if (signal?.aborted) return null;
    return loadBestOfYear(year, category, genreId, region);
  });