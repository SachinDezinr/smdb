import { supabase } from './supabase';

export type MediaType = "movie" | "tv" | "anime" | "k-drama";
export type Region = "all" | "hollywood" | "bollywood" | "punjabi" | "south-indian" | "animated" | "international" | "korean" | "indian";

export interface ContentItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  vote_average: number;
  media_type: MediaType;
  genre_ids: number[];
  overview: string;
  popularity?: number;
  adult?: boolean;
  videos?: { results: any[] };
}

const PROXY_URL = "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";

// Persistent Cache for the session
let cachedSession: any = null;

// SWR Cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const getRegionParams = (region: Region): Record<string, string> => {
  switch (region) {
    case "bollywood": return { with_original_language: "hi", region: "IN" };
    case "punjabi": return { with_original_language: "pa", region: "IN" };
    case "south-indian": return { with_original_language: "te|ta|kn|ml", region: "IN" };
    case "hollywood": return { with_original_language: "en", region: "US" };
    case "animated": return { with_genres: "16" };
    case "korean": return { with_original_language: "ko" };
    case "indian": return { with_original_language: "hi|te|ta|kn|ml|pa", region: "IN" };
    case "international": return { with_original_language: "fr|de|es|it|ja|ko|zh|hi|te|ta|kn|ml|pa" };
    default: return {};
  }
};

const fetchFromProxy = async (path: string, params: Record<string, string | number | boolean> = {}) => {
  const cacheKey = JSON.stringify({ path, params });
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  if (!cachedSession) {
    const { data: { session } } = await supabase.auth.getSession();
    cachedSession = session;
  }
  
  const url = new URL(PROXY_URL);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${cachedSession?.access_token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  
  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: now });
  return data;
};

const mapResults = (results: any[], defaultType: MediaType): ContentItem[] => {
  return (results || [])
    .filter((item: any) => !item.adult && item.poster_path)
    .map((item: any) => {
      let type = (item.media_type as MediaType) || defaultType;
      if (item.original_language === 'ja' && item.genre_ids?.includes(16)) type = 'anime';
      else if (item.original_language === 'ko' && (item.media_type === 'tv' || type === 'tv')) type = 'k-drama';

      return {
        id: item.id,
        title: item.title || item.name,
        poster_path: `https://image.tmdb.org/t/p/w342${item.poster_path}`,
        backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "",
        release_date: item.release_date || item.first_air_date || "TBA",
        vote_average: item.vote_average || 0,
        media_type: type,
        genre_ids: item.genre_ids || [],
        overview: item.overview,
        popularity: item.popularity || 0
      };
    });
};

export const fetchTrending = async (): Promise<ContentItem[]> => {
  // Optimized: Fetch only 2 essential categories for the hero section
  const [globalMovies, indianMovies] = await Promise.all([
    fetchFromProxy('/trending/movie/day', { append_to_response: 'videos' }),
    fetchFromProxy('/discover/movie', { region: 'IN', with_original_language: 'hi|te|ta|kn|ml', sort_by: 'popularity.desc', include_adult: false })
  ]);

  const gm = mapResults(globalMovies.results || [], 'movie');
  const im = mapResults(indianMovies.results || [], 'movie');

  const combined = [];
  const max = Math.max(gm.length, im.length);
  for (let i = 0; i < max; i++) {
    if (gm[i]) combined.push(gm[i]);
    if (im[i]) combined.push(im[i]);
  }

  return combined.slice(0, 10);
};

export const fetchTrailers = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/videos`);
  const trailer = data.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
};

export const fetchContent = async (
  type: MediaType,
  year?: number,
  page: number = 1,
  query: string = "",
  region: Region = "all"
): Promise<ContentItem[]> => {
  if (query) {
    const data = await fetchFromProxy('/search/multi', { query, page, include_adult: false });
    return mapResults(data.results || [], type);
  }

  const targetYear = year || new Date().getFullYear();
  const path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  const params: any = { 
    page, 
    include_adult: false,
    sort_by: 'popularity.desc',
    ...getRegionParams(region),
    [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: targetYear
  };

  if (type === "anime") { params.with_keywords = '210024'; params.with_original_language = 'ja'; }
  else if (type === "k-drama") { params.with_original_language = 'ko'; }

  const data = await fetchFromProxy(path, params);
  return mapResults(data.results || [], type);
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/credits`);
  return {
    director: data.crew?.find((c: any) => c.job === 'Director')?.name,
    cast: data.cast?.slice(0, 5).map((c: any) => c.name)
  };
};

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  const path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  const params: any = { 
    page, 
    include_adult: false,
    sort_by: type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
    ...getRegionParams(region),
    [type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte']: today
  };

  const data = await fetchFromProxy(path, params);
  return mapResults(data.results || [], type);
};