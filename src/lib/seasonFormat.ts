import type { MediaType } from "./tmdb/types";

export interface SeasonInfo {
  season_number?: number;
  air_date?: string | null;
}

export const isSeasonReleased = (
  airDate?: string | null,
): boolean => {
  if (!airDate) return false;

  const date = new Date(airDate);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  date.setHours(0, 0, 0, 0);

  return date <= today;
};

export const countReleasedSeasons = (
  seasons?: SeasonInfo[] | null,
): number => {
  if (!seasons?.length) {
    return 0;
  }

  return seasons.filter(
    (season) =>
      typeof season.season_number === "number" &&
      season.season_number > 0 &&
      isSeasonReleased(season.air_date),
  ).length;
};

export const getSeasonDisplayText = (
  seasonCount?: number | null,
): string => {
  if (!seasonCount || seasonCount <= 0) {
    return "";
  }

  return seasonCount === 1
    ? "(S1)"
    : `(S1 - S${Math.floor(seasonCount)})`;
};

export const isSeriesMediaType = (
  mediaType: MediaType | string,
): boolean =>
  mediaType === "tv" ||
  mediaType === "anime" ||
  mediaType === "k-drama";