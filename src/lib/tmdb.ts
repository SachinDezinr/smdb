import { supabase } from './supabase';

export type MediaType = "movie" | "tv" | "anime" | "k-drama";
export type Region = "all" | "hollywood" | "bollywood" | "punjabi" | "south-indian" | "animated";

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
  director?: string;
  cast?: string[];
}

const PROXY_URL = "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";

const getRegionParams = (region: Region): Record<string, string> => {
  switch (region) {
    case "bollywood": return { with_original_language: "hi", region: "IN" };
    case "punjabi": return { with_original_language: "pa", region: "IN" };
    case "south-indian": return { with_original_language: "te|ta|kn|ml", region: "IN" };
    case "hollywood": return { with_original_language: "en", region: "US" };
    case "animated": return { with_genres: "16" };
    default: return {};
  }
};

const fetchFromProxy = async (path: string, params: Record<string, string | number | boolean> = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const url = new URL(PROXY_URL);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch from proxy');
  }
  
  return response.json();
};

const mapResults = (results: any[], type: MediaType): ContentItem[] => {
  return (results || []).map((item: any) => ({
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
    backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "",
    release_date: item.release_date || item.first_air_date || "TBA",
    vote_average: item.vote_average || 0,
    media_type: (item.media_type as MediaType) || type,
    genre_ids: item.genre_ids || [],
    overview: item.overview
  }));
};

const interleave = <T>(arr1: T[], arr2: T[]): T[] => {
  const result: T[] = [];
  const maxLen = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }
  return result;
};

export const fetchTrending = async (type: 'released' | 'upcoming' = 'released'): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  let results: any[] = [];
  if (type === 'released') {
    const [movies, tv] = await Promise.all([
      fetchFromProxy('/trending/movie/day'),
      fetchFromProxy('/trending/tv/day')
    ]);
    results = interleave(movies.results || [], tv.results || []);
  } else {
    const [movies, tv] = await Promise.all([
      fetchFromProxy('/discover/movie', { 'primary_release_date.gte': today, sort_by: 'popularity.desc' }),
      fetchFromProxy('/discover/tv', { 'first_air_date.gte': today, sort_by: 'popularity.desc' })
    ]);
    results = interleave(movies.results || [], tv.results || []);
  }

  const mapped = mapResults(results, 'movie');
  
  // Filter for items that have a trailer and backdrop
  const filtered: ContentItem[] = [];
  for (const item of mapped) {
    if (filtered.length >= 10) break;
    if (!item.backdrop_path) continue;
    
    // Check for trailer
    try {
      const trailer = await fetchTrailers(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
      if (trailer) {
        filtered.push(item);
      }
    } catch (e) {
      continue;
    }
  }

  return filtered;
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
  region: Region = "all",
  includeAdult: boolean = false
): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Hardened adult filter: exclude adult genres (10749 is Romance, but some adult content uses it. 18 is Drama. 
  // TMDB doesn't have a specific "Hentai" genre ID in the main list, but we can use the include_adult flag strictly)
  const baseParams: any = { 
    page, 
    include_adult: includeAdult,
    sort_by: 'popularity.desc'
  };

  if (query) {
    const [multiData, personData] = await Promise.all([
      fetchFromProxy('/search/multi', { query, page, include_adult: includeAdult }),
      fetchFromProxy('/search/person', { query, include_adult: includeAdult })
    ]);

    let results = [...(multiData.results || [])];

    if (personData.results?.length > 0) {
      const personId = personData.results[0].id;
      const creditsData = await fetchFromProxy(`/person/${personId}/combined_credits`, { include_adult: includeAdult });
      const personCredits = [
        ...(creditsData.cast || []),
        ...(creditsData.crew || []).filter((c: any) => c.job === 'Director')
      ];
      results = [...results, ...personCredits];
    }
    
    // Filter out duplicates and ensure sequels/parts are included by not limiting too early
    const seen = new Set();
    const unique = results.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return mapResults(unique, type);
  }

  const currentYear = new Date().getFullYear();
  const targetYear = year || currentYear;

  let path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  let params: any = { 
    ...baseParams,
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
  let results = mapResults(data.results || [], type);

  // If on Home page (not upcoming), filter out future releases
  if (targetYear >= currentYear) {
    results = results.filter(item => item.release_date <= today);
  }

  return results;
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/credits`);
  const director = data.crew?.find((c: any) => c.job === 'Director')?.name;
  const cast = data.cast?.slice(0, 5).map((c: any) => c.name);
  return { director, cast };
};

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1, includeAdult: boolean = false): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  let path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  let params: any = { 
    page, 
    include_adult: includeAdult,
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