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

// Persistent Cache for the session to avoid repeated async calls
let cachedSession: any = null;

// Enhanced SWR Cache with longer TTL for static content
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour for static content

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

  // Faster session retrieval
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
};

const mapResults = (results: any[], defaultType: MediaType): ContentItem[] => {
  const adultKeywords = ['hentai', 'porn', 'erotica', 'erotic'];

  return (results || [])
    .filter((item: any) => {
      if (item.adult) return false;
      if (!item.poster_path) return false;

      const title = (item.title || item.name || '').toLowerCase();
      const overview = (item.overview || '').toLowerCase();
      
      return !adultKeywords.some(kw => title.includes(kw) || overview.includes(kw));
    })
    .map((item: any) => {
      let type = (item.media_type as MediaType) || defaultType;
      
      const isAnimated = item.genre_ids?.includes(16);
      const isJapanese = item.original_language === 'ja';
      const isKorean = item.original_language === 'ko';

      if (isJapanese && isAnimated) {
        type = 'anime';
      } else if (isKorean && (item.media_type === 'tv' || type === 'tv')) {
        type = 'k-drama';
      }

      return {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : "",
        backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "",
        release_date: item.release_date || item.first_air_date || "TBA",
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

export const fetchTrending = async (): Promise<ContentItem[]> => {
  const [globalMovies, indianMovies, globalTv, anime, kdrama] = await Promise.all([
    fetchFromProxy('/trending/movie/day', { append_to_response: 'videos' }),
    fetchFromProxy('/discover/movie', { region: 'IN', with_original_language: 'hi|te|ta|kn|ml', sort_by: 'popularity.desc', include_adult: false, append_to_response: 'videos' }),
    fetchFromProxy('/trending/tv/day', { append_to_response: 'videos' }),
    fetchFromProxy('/discover/tv', { with_keywords: '210024', with_original_language: 'ja', sort_by: 'popularity.desc', include_adult: false, append_to_response: 'videos' }),
    fetchFromProxy('/discover/tv', { with_original_language: 'ko', sort_by: 'popularity.desc', include_adult: false, append_to_response: 'videos' })
  ]);

  const gm = mapResults(globalMovies.results || [], 'movie');
  const im = mapResults(indianMovies.results || [], 'movie');
  const gt = mapResults(globalTv.results || [], 'tv');
  const an = mapResults(anime.results || [], 'anime');
  const kd = mapResults(kdrama.results || [], 'k-drama');

  const combined = interleave(gm, im, gt, an, kd);
  
  const seen = new Set();
  const unique = [];
  
  for (const item of combined) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
    if (unique.length >= 12) break;
  }

  return unique;
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
    const [multiData, personData] = await Promise.all([
      fetchFromProxy('/search/multi', { query, page, include_adult: false }),
      fetchFromProxy('/search/person', { query, include_adult: false })
    ]);

    let results = [...(multiData.results || [])];

    if (personData.results?.length > 0) {
      const personId = personData.results[0].id;
      const creditsData = await fetchFromProxy(`/person/${personId}/combined_credits`, { include_adult: false });
      const personCredits = [
        ...(creditsData.cast || []),
        ...(creditsData.crew || []).filter((c: any) => c.job === 'Director')
      ];
      results = [...results, ...personCredits];
    }

    const mapped = mapResults(results, type);
    
    const seen = new Set();
    const unique = mapped.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return unique.sort((a, b) => {
      const q = query.toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      const aExact = aTitle === q;
      const bExact = bTitle === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aDate = a.release_date && a.release_date !== "TBA" ? new Date(a.release_date).getTime() : 0;
      const bDate = b.release_date && b.release_date !== "TBA" ? new Date(b.release_date).getTime() : 0;
      
      if (bDate !== aDate) {
        return bDate - aDate;
      }

      return (b.popularity || 0) - (a.popularity || 0);
    });
  }

  const currentYear = new Date().getFullYear();
  const targetYear = year || currentYear;

  if (region === "all" && (type === "movie" || type === "tv")) {
    const hollywoodParams = { 
      page, 
      include_adult: false,
      sort_by: 'popularity.desc',
      ...getRegionParams('hollywood'),
      [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: targetYear
    };
    
    const indianParams = { 
      page, 
      include_adult: false,
      sort_by: 'popularity.desc',
      region: 'IN',
      with_original_language: 'hi|te|ta|kn|ml|pa',
      [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: targetYear
    };

    const [hData, iData] = await Promise.all([
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, hollywoodParams),
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, indianParams)
    ]);

    return interleave(mapResults(hData.results || [], type), mapResults(iData.results || [], type));
  }

  let path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  let params: any = { 
    page, 
    include_adult: false,
    sort_by: 'popularity.desc',
    ...getRegionParams(region),
    [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: targetYear
  };

  if (type === "anime") {
    params.with_keywords = '210024';
    params.with_original_language = 'ja';
  } else if (type === "k-drama") {
    params.with_original_language = 'ko';
  }

  const data = await fetchFromProxy(path, params);
  return mapResults(data.results || [], type);
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/credits`);
  const director = data.crew?.find((c: any) => c.job === 'Director')?.name;
  const cast = data.cast?.slice(0, 5).map((c: any) => c.name);
  return { director, cast };
};

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  if (region === "all" && (type === "movie" || type === "tv")) {
    const hollywoodParams = {
      page,
      include_adult: false,
      sort_by: type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
      ...getRegionParams('hollywood'),
      [type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte']: today
    };

    const indianParams = {
      page,
      include_adult: false,
      sort_by: type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
      region: 'IN',
      with_original_language: 'hi|te|ta|kn|ml|pa',
      [type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte']: today
    };

    const [hData, iData] = await Promise.all([
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, hollywoodParams),
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, indianParams)
    ]);

    return interleave(mapResults(hData.results || [], type), mapResults(iData.results || [], type));
  }

  let path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  let params: any = { 
    page, 
    include_adult: false,
    sort_by: type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
    ...getRegionParams(region),
    [type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte']: today
  };

  if (type === "anime") {
    params.with_keywords = '210024';
    params.with_original_language = 'ja';
  } else if (type === "k-drama") {
    params.with_original_language = 'ko';
  }
    
  const data = await fetchFromProxy(path, params);
  return mapResults(data.results || [], type);
};

export const warmCache = async () => {
  try {
    // Mild cache warming: Only pre-fetch trending content as it's the first thing users see
    const trending = await fetchTrending();

    // Preload only the first few trending posters to ensure a smooth hero section
    const posters = trending
      .map(i => i.poster_path)
      .filter(Boolean)
      .slice(0, 5);
    
    posters.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  } catch (err) {
    console.warn("[tmdb] Mild cache warming failed", err);
  }
};