import { fetchFromProxy } from './client';
import { ContentItem } from './types';
import { isSeriesMediaType } from '../seasonFormat';

// In-memory cache for season counts by content ID
const seasonCache = new Map<number, number>();

/**
 * Fetches the total number of regular seasons for a TV series, anime, or k-drama.
 * TMDB's /tv/{id} returns number_of_seasons and seasons array.
 * We count seasons with season_number > 0 (excluding Season 0 "Specials") if available,
 * or fallback to number_of_seasons.
 */
export const fetchTvSeasons = async (id: number): Promise<number | undefined> => {
  if (!id) return undefined;
  if (seasonCache.has(id)) {
    return seasonCache.get(id);
  }

  try {
    const data = await fetchFromProxy(`/tv/${id}`);
    if (data) {
      let count = data.number_of_seasons;
      if (Array.isArray(data.seasons)) {
        const regularSeasons = data.seasons.filter((s: any) => s && s.season_number > 0);
        if (regularSeasons.length > 0) {
          count = regularSeasons.length;
        }
      }
      if (typeof count === 'number' && count > 0) {
        seasonCache.set(id, count);
        return count;
      }
    }
  } catch (err) {
    console.warn(`[tmdb] Error fetching seasons for tv ID ${id}:`, err);
  }

  return undefined;
};

/**
 * Pre-populates the cache with known season counts
 */
export const cacheTvSeason = (id: number, seasons: number) => {
  if (id && seasons > 0) {
    seasonCache.set(id, seasons);
  }
};

/**
 * Gets cached season count synchronously if available
 */
export const getCachedTvSeason = (id: number): number | undefined => {
  return seasonCache.get(id);
};
