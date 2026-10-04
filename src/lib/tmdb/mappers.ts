import { countReleasedSeasons } from '../seasonFormat';
import { ContentItem, MediaType } from './types';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

const ADULT_KEYWORDS = [
  'hentai', 'porn', 'erotica', 'erotic', 'sexy', 'hot scenes',
  'ullu', 'altbalaji', 'kooku', 'hotshots', 'primeplay', 'voovi',
  'rabbit movies', 'gully movies', 'besharams', 'hunters', 'atrangii',
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Built once: a single case-insensitive pattern instead of lowercasing
// strings and running 17 includes() calls for every item.
const ADULT_PATTERN = new RegExp(ADULT_KEYWORDS.map(escapeRegExp).join('|'), 'i');

const imageUrl = (size: string, path?: string | null) => (path ? `${TMDB_IMG}/${size}${path}` : '');

/* ------------------------------ media type ------------------------------ */

const isAnimated = (item: any): boolean =>
  !!item.genre_ids?.includes(16) ||
  !!item.genres?.some((g: any) => g.id === 16 || g.name === 'Animation');

const matchesOrigin = (item: any, language: string, country: string): boolean =>
  item.original_language === language ||
  (Array.isArray(item.origin_country) && item.origin_country.includes(country));

// Same rules as before, flattened, with each check evaluated only when needed.
const resolveMediaType = (item: any, defaultType: MediaType): MediaType => {
  if (defaultType === 'anime') return 'anime';

  const isJapanese = matchesOrigin(item, 'ja', 'JP');

  // Japanese animation is anime whichever list it came from
  if (isJapanese && isAnimated(item)) return 'anime';

  if (defaultType === 'k-drama') return 'k-drama';

  const isExplicitTv =
    item.media_type === 'tv' || !!item.first_air_date || (defaultType === 'tv' && !item.title);

  if (isExplicitTv && matchesOrigin(item, 'ko', 'KR')) return 'k-drama';
  if (isJapanese) return 'anime';
  if (isExplicitTv) return 'tv';

  if (item.media_type === 'movie' || (defaultType === 'movie' && !item.first_air_date)) return 'movie';

  return (item.media_type as MediaType) || defaultType;
};

/* ------------------------------ mapping ------------------------------ */

export const mapResults = (results: any[], defaultType: MediaType): ContentItem[] => {
  const mapped: ContentItem[] = [];
  if (!results) return mapped;

  // One pass: filter and map together, no intermediate arrays
  for (const item of results) {
    if (item.adult) continue;

    const title = (item.title || item.name || '').trim();
    if (!title) continue;

    // Cheap checks first, regex last
    const hasPoster = !!item.poster_path;
    const hasRating = typeof item.vote_average === 'number' && item.vote_average > 0;
    if (!hasPoster && !hasRating) continue;

    if (ADULT_PATTERN.test(title) || ADULT_PATTERN.test(item.overview || '')) continue;

    mapped.push({
      id: item.id,
      title: item.title || item.name,
      poster_path: imageUrl('w342', item.poster_path),
      backdrop_path: imageUrl('w1280', item.backdrop_path),
      release_date: item.release_date || item.first_air_date || 'TBA',
      vote_average: item.vote_average || 0,
      media_type: resolveMediaType(item, defaultType),
      genre_ids: item.genre_ids || [],
      overview: item.overview || '',
      popularity: item.popularity || 0,
      adult: item.adult,
      videos: item.videos,
      season_count: Array.isArray(item.seasons)
        ? countReleasedSeasons(item.seasons)
        : (typeof item.number_of_seasons === 'number' ? item.number_of_seasons : undefined),
    });
  }

  return mapped;
};

/* ------------------------------ list helpers ------------------------------ */

export const interleave = <T>(...arrays: T[][]): T[] => {
  let maxLen = 0;
  for (const arr of arrays) if (arr.length > maxLen) maxLen = arr.length;

  const result: T[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) result.push(arr[i]);
    }
  }
  return result;
};

export const uniqueById = (items: ContentItem[]): ContentItem[] => {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/* ------------------------------ sorting ------------------------------ */

const RATING_BONUS_MS = 90 * 24 * 60 * 60 * 1000;

const releaseTime = (date?: string): number => {
  if (!date || date === 'TBA') return 0;
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
};

export const sortYearContent = (items: ContentItem[]) => {
  // Score each item once, instead of parsing dates inside every comparison
  const keyed = items.map((item) => ({
    item,
    score: releaseTime(item.release_date) + (item.vote_average > 0 ? RATING_BONUS_MS : 0),
    popularity: item.popularity || 0,
  }));

  keyed.sort((a, b) => b.score - a.score || b.popularity - a.popularity);

  // Write back so the input array is still sorted in place, as before
  for (let i = 0; i < keyed.length; i++) items[i] = keyed[i].item;
  return items;
};