export interface StatsData {
  total: number;
  yearTotal: number;
  topGenre: string;
  avgRating: string;
  counts: {
    movie: number;
    tv: number;
    anime: number;
    kdrama: number;
  };
}

export interface SocialCircleData {
  friends: unknown[];
  incomingRequests: unknown[];
  sentRequests: unknown[];
}

const STATS_TTL = 5 * 60 * 1000;
const SOCIAL_TTL = 3 * 60 * 1000;

let cachedStats: StatsData | null = null;
let statsLastFetched = 0;

let cachedSocialCircle: SocialCircleData | null = null;
let socialCircleLastFetched = 0;

export const getCachedStats = (): StatsData | null => cachedStats;

export const setCachedStats = (stats: StatsData): void => {
  cachedStats = stats;
  statsLastFetched = Date.now();
};

export const isStatsCacheValid = (): boolean =>
  cachedStats !== null && Date.now() - statsLastFetched < STATS_TTL;

export const clearCachedStats = (): void => {
  cachedStats = null;
  statsLastFetched = 0;
};

export const getCachedSocialCircle = (): SocialCircleData | null =>
  cachedSocialCircle;

export const setCachedSocialCircle = (
  data: SocialCircleData,
): void => {
  cachedSocialCircle = data;
  socialCircleLastFetched = Date.now();
};

export const isSocialCircleCacheValid = (): boolean =>
  cachedSocialCircle !== null &&
  Date.now() - socialCircleLastFetched < SOCIAL_TTL;

export const clearCachedSocialCircle = (): void => {
  cachedSocialCircle = null;
  socialCircleLastFetched = 0;
};

export const clearPageDataCache = (): void => {
  clearCachedStats();
  clearCachedSocialCircle();
};