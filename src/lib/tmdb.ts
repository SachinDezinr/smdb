import { supabase } from './supabase';

export type MediaType = "movie" | "tv" | "anime" | "k-drama";
export type Region = "all" | "hollywood" | "bollywood" | "punjabi" | "south-indian" | "animated" | "international" | "korean" | "indian";

export interface ContentItem {
  id: number;
  title: string;
  name?: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  first_air_date?: string;
  vote_average: number;
  media_type: MediaType;
  genre_ids: number[];
  overview: string;
  popularity?: number;
  adult?: boolean;
  videos?: { results: any[] };
  credits?: {
    cast: { id: number; name: string }[];
    crew: { id: number; name: string; job: string }[];
  };
}

const PROXY_URL = "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";

let cachedSession: any = null;
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60;

const inFlight = new Map<string, Promise<any>>();

const getRegionParams = (region: Region): Record<string, string> => {
  switch (region) {
    case "bollywood": return { with_original_language: "hi", region: "IN", with_release_type: "3" };
    case "punjabi": return { with_original_language: "pa", region: "IN", with_release_type: "3" };
    case "south-indian": return { with_original_language: "te|ta|kn|ml", region: "IN", with_release_type: "3" };
    case "hollywood": return { with_original_language: "en", region: "US", with_release_type: "3" };
    case "animated": return { with_genres: "16" };
    case "korean": return { with_original_language: "ko" };
    case "indian": return { with_original_language: "hi|te|ta|kn|ml|pa", region: "IN", with_release_type: "3" };
    case "international": return { with_original_language: "fr|de|es|it|ja|ko|zh|hi|te|ta|kn|ml|pa" };
    default: return {};
  }
};

const fetchFromProxy = async (path: string, params: Record<string, string | number | boolean> = {}) => {
  const cacheKey = JSON.stringify({ path, params });
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  if (inFlight.has(cacheKey)) {
    return inFlight.get(cacheKey);
  }

  const requestPromise = (async () => {
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
      throw new Error(error.error || 'Failed to fetch from proxy');
    }
    
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  })();

  inFlight.set(cacheKey, requestPromise);
  
  try {
    return await requestPromise;
  } finally {
    inFlight.delete(cacheKey);
  }
};

const mapResults = (results: any[], defaultType: MediaType): ContentItem[] => {
  return (results || [])
    .filter((item: any) => item.poster_path && !item.adult)
    .map((item: any) => {
      let type = (item.media_type as MediaType) || defaultType;
      const isAnimated = item.genre_ids?.includes(16);
      const isJapanese = item.original_language === 'ja';
      const isKorean = item.original_language === 'ko';

      if (isJapanese && isAnimated) type = 'anime';
      else if (isKorean && (item.media_type === 'tv' || type === 'tv')) type = 'k-drama';

      return {
        id: item.id,
        title: item.title || item.name,
        name: item.name,
        poster_path: `https://image.tmdb.org/t/p/w342${item.poster_path}`,
        backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "",
        release_date: item.release_date || item.first_air_date || "TBA",
        first_air_date: item.first_air_date,
        vote_average: item.vote_average || 0,
        media_type: type,
        genre_ids: item.genre_ids || [],
        overview: item.overview,
        popularity: item.popularity || 0,
        adult: item.adult,
        videos: item.videos
      };
    });
};

const interleave = <T>(...arrays: T[][]): T[] => {
  const result: T[] = [];
  const maxLen = Math.max(...arrays.map(a => a.length));
  for (let i = 0; i < maxLen; i++) {
    arrays.forEach(arr => {
      if (i < arr.length) result.push(arr[i]);
    });
  }
  return result;
};

const uniqueById = (items: ContentItem[]): ContentItem[] => {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export const fetchTrending = async (): Promise<ContentItem[]> => {
  const [globalMovies, indianMovies, globalTv, anime, kdrama] = await Promise.all([
    fetchFromProxy('/trending/movie/day'),
    fetchFromProxy('/discover/movie', { region: 'IN', with_original_language: 'hi|te|ta|kn|ml', sort_by: 'popularity.desc', with_release_type: '3' }),
    fetchFromProxy('/trending/tv/day'),
    fetchFromProxy('/discover/tv', { with_keywords: '210024', with_original_language: 'ja', sort_by: 'popularity.desc' }),
    fetchFromProxy('/discover/tv', { with_original_language: 'ko', sort_by: 'popularity.desc' })
  ]);

  const combined = interleave(
    mapResults(globalMovies.results || [], 'movie'),
    mapResults(indianMovies.results || [], 'movie'),
    mapResults(globalTv.results || [], 'tv'),
    mapResults(anime.results || [], 'anime'),
    mapResults(kdrama.results || [], 'k-drama')
  );
  return uniqueById(combined).slice(0, 12);
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
    return uniqueById(mapResults(data.results || [], type));
  }

  const today = new Date().toISOString().split('T')[0];
  const baseParams: any = {
    page,
    include_adult: false,
    sort_by: 'popularity.desc',
    [type === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte']: today
  };

  if (year) {
    baseParams[type === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year;
  }

  if (region === "all" && (type === "movie" || type === "tv")) {
    const [hData, iData] = await Promise.all([
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, { ...baseParams, ...getRegionParams('hollywood') }),
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, { ...baseParams, ...getRegionParams('indian') })
    ]);
    const combined = interleave(mapResults(hData.results || [], type), mapResults(iData.results || [], type));
    return uniqueById(combined);
  }

  const params = { ...baseParams, ...getRegionParams(region) };
  if (type === "anime") { params.with_keywords = '210024'; params.with_original_language = 'ja'; }
  else if (type === "k-drama") { params.with_original_language = 'ko'; }

  const data = await fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, params);
  return uniqueById(mapResults(data.results || [], type));
};

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  const baseParams: any = {
    page,
    include_adult: false,
    sort_by: type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
    [type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte']: today
  };

  if (region === "all" && (type === "movie" || type === "tv")) {
    const [hData, iData] = await Promise.all([
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, { ...baseParams, ...getRegionParams('hollywood') }),
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, { ...baseParams, ...getRegionParams('indian') })
    ]);
    return uniqueById(interleave(mapResults(hData.results || [], type), mapResults(iData.results || [], type)));
  }

  const params = { ...baseParams, ...getRegionParams(region) };
  if (type === "anime") { params.with_keywords = '210024'; params.with_original_language = 'ja'; }
  else if (type === "k-drama") { params.with_original_language = 'ko'; }
    
  const data = await fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, params);
  return uniqueById(mapResults(data.results || [], type));
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/credits`);
  const director = data.crew?.find((c: any) => c.job === 'Director')?.name;
  const cast = data.cast?.slice(0, 5).map((c: any) => ({ id: c.id, name: c.name }));
  return { director, cast };
};

export const fetchTrailers = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/videos`);
  const trailer = data.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
};

export const smartWarmCache = async () => {
  const currentYear = new Date().getFullYear();
  try {
    await Promise.all([fetchContent('movie', currentYear), fetchUpcoming('movie')]);
  } catch (err) {
    console.warn("[tmdb] Smart warming failed", err);
  }
};