import { countReleasedSeasons } from "../seasonFormat";
import {
  ContentItem,
  MediaType,
  TMDBListItem,
} from "./types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const POSTER_SIZE = "w342";
const BACKDROP_SIZE = "w1280";

const ADULT_KEYWORDS = [
  "hentai",
  "porn",
  "erotica",
  "erotic",
  "sexy",
  "hot scenes",
  "ullu",
  "altbalaji",
  "kooku",
  "hotshots",
  "primeplay",
  "voovi",
  "rabbit movies",
  "gully movies",
  "besharams",
  "hunters",
  "atrangii",
] as const;

const ANIMATION_GENRE_ID = 16;

const toImageUrl = (
  path: string | null | undefined,
  size: string,
): string => {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeNumber = (
  value: unknown,
  fallback = 0,
): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
};

const isAdultKeywordMatch = (
  title: string,
  overview: string,
): boolean => {
  const normalizedTitle = title.toLowerCase();
  const normalizedOverview = overview.toLowerCase();

  return ADULT_KEYWORDS.some(
    (keyword) =>
      normalizedTitle.includes(keyword) ||
      normalizedOverview.includes(keyword),
  );
};

const hasAnimationGenre = (item: TMDBListItem): boolean => {
  if (item.genre_ids?.includes(ANIMATION_GENRE_ID)) {
    return true;
  }

  return Boolean(
    item.genres?.some(
      (genre) =>
        genre.id === ANIMATION_GENRE_ID ||
        genre.name?.toLowerCase() === "animation",
    ),
  );
};

const isJapaneseContent = (item: TMDBListItem): boolean => {
  return (
    item.original_language === "ja" ||
    item.origin_country?.includes("JP") === true
  );
};

const isKoreanContent = (item: TMDBListItem): boolean => {
  return (
    item.original_language === "ko" ||
    item.origin_country?.includes("KR") === true
  );
};

const isExplicitTv = (
  item: TMDBListItem,
  defaultType: MediaType,
): boolean => {
  return (
    item.media_type === "tv" ||
    Boolean(item.first_air_date) ||
    (defaultType === "tv" && !item.title)
  );
};

const isExplicitMovie = (
  item: TMDBListItem,
  defaultType: MediaType,
): boolean => {
  return (
    item.media_type === "movie" ||
    (defaultType === "movie" && !item.first_air_date)
  );
};

const resolveMediaType = (
  item: TMDBListItem,
  defaultType: MediaType,
): MediaType => {
  const animated = hasAnimationGenre(item);
  const japanese = isJapaneseContent(item);
  const korean = isKoreanContent(item);

  const explicitTv = isExplicitTv(item, defaultType);
  const explicitMovie = isExplicitMovie(item, defaultType);

  /*
   * Keep the application's existing classification rules:
   *
   * - Japanese animated content => anime
   * - Anime discovery/search => anime
   * - Korean TV => k-drama
   * - K-drama discovery => k-drama
   * - Japanese content => anime
   * - Explicit TV => tv
   * - Explicit movie => movie
   */
  if (
    (japanese && animated) ||
    (japanese && defaultType === "anime") ||
    defaultType === "anime"
  ) {
    return "anime";
  }

  if (
    korean &&
    (explicitTv || defaultType === "k-drama")
  ) {
    return "k-drama";
  }

  if (defaultType === "k-drama") {
    return "k-drama";
  }

  if (japanese) {
    return "anime";
  }

  if (explicitTv) {
    return "tv";
  }

  if (explicitMovie) {
    return "movie";
  }

  if (
    item.media_type === "movie" ||
    item.media_type === "tv"
  ) {
    return item.media_type;
  }

  return defaultType;
};

const hasUsefulContent = (item: TMDBListItem): boolean => {
  const title = normalizeText(item.title ?? item.name);

  if (!title) {
    return false;
  }

  if (item.adult === true) {
    return false;
  }

  const overview = normalizeText(item.overview);

  if (isAdultKeywordMatch(title, overview)) {
    return false;
  }

  const hasPoster = Boolean(item.poster_path);

  const hasRating =
    typeof item.vote_average === "number" &&
    item.vote_average > 0;

  /*
   * Keep titles that have either a poster or a valid rating.
   * This prevents empty/low-quality TMDB records from reaching
   * the UI while still allowing useful search results.
   */
  return hasPoster || hasRating;
};

const getSeasonCount = (
  item: TMDBListItem,
): number | undefined => {
  if (Array.isArray(item.seasons)) {
    return countReleasedSeasons(item.seasons);
  }

  if (
    typeof item.number_of_seasons === "number" &&
    Number.isFinite(item.number_of_seasons)
  ) {
    return item.number_of_seasons;
  }

  return undefined;
};

const mapItem = (
  item: TMDBListItem,
  defaultType: MediaType,
): ContentItem => {
  const title = normalizeText(item.title ?? item.name);

  return {
    id: item.id,

    title,

    poster_path: toImageUrl(
      item.poster_path,
      POSTER_SIZE,
    ),

    backdrop_path: toImageUrl(
      item.backdrop_path,
      BACKDROP_SIZE,
    ),

    release_date:
      normalizeText(
        item.release_date ?? item.first_air_date,
      ) || "TBA",

    vote_average: normalizeNumber(
      item.vote_average,
    ),

    vote_count: normalizeNumber(
      item.vote_count,
    ),

    media_type: resolveMediaType(
      item,
      defaultType,
    ),

    genre_ids: Array.isArray(item.genre_ids)
      ? item.genre_ids
      : [],

    overview: normalizeText(item.overview),

    popularity: normalizeNumber(
      item.popularity,
    ),

    adult: item.adult === true,

    original_language:
      normalizeText(item.original_language) ||
      undefined,

    origin_country:
      Array.isArray(item.origin_country)
        ? item.origin_country
        : undefined,

    videos: item.videos,

    genres: item.genres,

    seasons: item.seasons,

    season_count: getSeasonCount(item),
  };
};

/**
 * Convert raw TMDB results into the application's
 * normalized ContentItem format.
 */
export const mapResults = (
  results: TMDBListItem[],
  defaultType: MediaType,
): ContentItem[] => {
  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }

  return results
    .filter(hasUsefulContent)
    .map((item) => mapItem(item, defaultType));
};

/**
 * Interleave multiple arrays:
 *
 * [A1, A2, A3]
 * [B1, B2, B3]
 *
 * becomes:
 *
 * [A1, B1, A2, B2, A3, B3]
 *
 * Useful for mixing regional/content sources
 * without showing one source completely before another.
 */
export const interleave = <T>(
  ...arrays: T[][]
): T[] => {
  if (arrays.length === 0) {
    return [];
  }

  const result: T[] = [];

  const maxLength = Math.max(
    ...arrays.map((array) => array.length),
  );

  for (let index = 0; index < maxLength; index += 1) {
    for (const array of arrays) {
      if (index < array.length) {
        result.push(array[index]);
      }
    }
  }

  return result;
};

/**
 * Remove duplicate content by TMDB ID.
 *
 * Keeps the first occurrence so the ordering produced
 * by the query layer remains intact.
 */
export const uniqueById = (
  items: ContentItem[],
): ContentItem[] => {
  const seen = new Set<number>();
  const unique: ContentItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
  }

  return unique;
};

const getReleaseTimestamp = (
  releaseDate: string,
): number => {
  if (!releaseDate || releaseDate === "TBA") {
    return 0;
  }

  const timestamp = Date.parse(releaseDate);

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
};

/**
 * Sort year-based content.
 *
 * Primary:
 *   - release date
 *   - rated content receives a small bonus
 *
 * Secondary:
 *   - TMDB popularity
 *
 * Returns a new array instead of mutating the input.
 */
export const sortYearContent = (
  items: ContentItem[],
): ContentItem[] => {
  const RATING_BONUS =
    90 * 24 * 60 * 60 * 1000;

  return [...items].sort((a, b) => {
    const aDate = getReleaseTimestamp(
      a.release_date,
    );

    const bDate = getReleaseTimestamp(
      b.release_date,
    );

    const aHasRating = a.vote_average > 0;
    const bHasRating = b.vote_average > 0;

    const aScore =
      aDate +
      (aHasRating ? RATING_BONUS : 0);

    const bScore =
      bDate +
      (bHasRating ? RATING_BONUS : 0);

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    return (
      b.popularity -
      a.popularity
    );
  });
};