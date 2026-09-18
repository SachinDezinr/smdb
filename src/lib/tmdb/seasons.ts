import { fetchFromProxy } from './client';
import { countReleasedSeasons } from '../seasonFormat';

// In-memory cache for season counts by content ID
const seasonCache = new Map<number, number>();

/**
 * Fetches the total number of regular seasons that have ALREADY BEEN RELEASED
 * for a TV series, anime, or k-drama.
 * TMDB's /tv/{id} returns a `seasons` array with air_date and season_number.
 * We only count regular seasons (season_number > 0) whose air_date is on or before today.
 * Any announced or upcoming seasons without a past/current air_date are excluded.
 * When a new season is released and reached its air date, this automatically includes it.
 */
export const fetchTvSeasons = async (id: number): Promise<number | undefined> => {
  if (!id) return undefined;
  if (seasonCache.has(id)) {
    return seasonCache.get(id);
  }

  try {
    const data = await fetchFromProxy(`/tv/${id}`);
    if (data) {
      let count: number | undefined;
      if (Array.isArray(data.seasons)) {
        count = countReleasedSeasons(data.seasons);
      } else if (typeof data.number_of_seasons === 'number') {
        count = data.number_of_seasons;
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
