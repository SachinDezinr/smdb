import { MediaType } from './tmdb/types';

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
