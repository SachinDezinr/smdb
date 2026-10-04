import { countReleasedSeasons, type SeasonInfo } from "../seasonFormat";
import { fetchFromProxy } from "./client";

interface TvDetailsResponse {
  seasons?: SeasonInfo[];
  number_of_seasons?: number;
}

const seasonCache = new Map<number, number>();

export const fetchTvSeasons = async (
  id: number,
): Promise<number | undefined> => {
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }

  const cached = seasonCache.get(id);

  if (cached !== undefined) {
    return cached;
  }

  try {
    const data = await fetchFromProxy<TvDetailsResponse>(`/tv/${id}`);

    if (!data) {
      return undefined;
    }

    const count = Array.isArray(data.seasons)
      ? countReleasedSeasons(data.seasons)
      : typeof data.number_of_seasons === "number"
        ? Math.max(0, Math.floor(data.number_of_seasons))
        : undefined;

    if (count !== undefined && count > 0) {
      seasonCache.set(id, count);
      return count;
    }
  } catch (error) {
    console.warn(
      `[tmdb] Failed to fetch seasons for TV ID ${id}:`,
      error,
    );
  }

  return undefined;
};

export const cacheTvSeason = (
  id: number,
  seasons: number,
): void => {
  if (
    Number.isFinite(id) &&
    id > 0 &&
    Number.isFinite(seasons) &&
    seasons > 0
  ) {
    seasonCache.set(id, Math.floor(seasons));
  }
};

export const getCachedTvSeason = (
  id: number,
): number | undefined => seasonCache.get(id);

export const clearTvSeasonCache = (): void => {
  seasonCache.clear();
};