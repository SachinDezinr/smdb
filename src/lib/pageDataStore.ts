// In-memory / session-backed stores to prevent refetch spinners on tab/page transitions

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

let cachedStats: StatsData | null = null;
let statsLastFetched = 0;
const STATS_TTL = 1000 * 60 * 5; // 5 minutes

export const getCachedStats = (): StatsData | null => cachedStats;

export const setCachedStats = (stats: StatsData) => {
  cachedStats = stats;
  statsLastFetched = Date.now();
};

export const clearCachedStats = () => {
  cachedStats = null;
  statsLastFetched = 0;
};

export interface SocialCircleData {
  friends: any[];
  incomingRequests: any[];
  sentRequests: any[];
}

let cachedSocialCircle: SocialCircleData | null = null;
let socialCircleLastFetched = 0;
const SOCIAL_TTL = 1000 * 60 * 3; // 3 minutes

export const getCachedSocialCircle = (): SocialCircleData | null => cachedSocialCircle;

export const setCachedSocialCircle = (data: SocialCircleData) => {
  cachedSocialCircle = data;
  socialCircleLastFetched = Date.now();
};

export const clearCachedSocialCircle = () => {
  cachedSocialCircle = null;
  socialCircleLastFetched = 0;
};
