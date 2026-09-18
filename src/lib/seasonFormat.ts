import { MediaType } from './tmdb/types';

/**
 * Checks whether a season has already been released based on its air_date.
 * Returns true if air_date exists, is valid, and is less than or equal to today's date (UTC/local date comparison).
 */
export function isSeasonReleased(airDate?: string | null): boolean {
  if (!airDate) return false;
  const releaseDate = new Date(airDate);
  if (isNaN(releaseDate.getTime())) return false;
  const now = new Date();
  // Strip time for clean date-only comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const air = new Date(releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate());
  return air <= today;
}

/**
 * Counts only officially released regular seasons (season_number > 0 and air_date <= today).
 * If seasons array is provided, it filters out unreleased / announced / specials.
 */
export function countReleasedSeasons(seasons?: Array<{ season_number?: number; air_date?: string | null }> | null): number {
  if (!Array.isArray(seasons)) return 0;
  return seasons.filter((s) => {
    if (!s || typeof s.season_number !== 'number' || s.season_number <= 0) return false;
    return isSeasonReleased(s.air_date);
  }).length;
}

/**
 * Returns formatted season text based on total number of seasons:
 * - 1 season -> "(S1)"
 * - 2 seasons -> "(S1 - S2)"
 * - 5 seasons -> "(S1 - S5)"
 * Returns empty string if seasons count is null, undefined, or <= 0.
 */
export function getSeasonDisplayText(seasons?: number | null): string {
  if (!seasons || seasons <= 0) return '';
  if (seasons === 1) return '(S1)';
  return `(S1 - S${seasons})`;
}

/**
 * Checks whether a given media type qualifies for season display:
 * Only TV / web series ('tv'), anime ('anime'), and K-dramas ('k-drama').
 * Movies and other one-time content are excluded.
 */
export function isSeriesMediaType(mediaType: MediaType | string): boolean {
  return mediaType === 'tv' || mediaType === 'anime' || mediaType === 'k-drama';
}
