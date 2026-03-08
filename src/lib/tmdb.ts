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

// Interleave two arrays to provide a balanced mix
const interleave = <T>(arr1: T[], arr2: T[]): T[] => {
  const result: T[] = [];
  const maxLen = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }
  return result;
};

export const fetchTrending = async (type: 'movie' | 'tv' = 'movie'): Promise<ContentItem[]> => {
  // Fetch global trending and Indian trending separately to ensure a mix
  const [globalData, indianData] = await Promise.all([
    fetchFromProxy(`/trending/${type}/week`),
    fetchFromProxy(`/discover/${type}`, { 
      region: 'IN', 
      with_original_language: 'hi|te|ta|kn|ml',
      sort_by: 'popularity.desc'
    })
  ]);

  const global = mapResults(globalData.results || [], type as MediaType);
  const indian = mapResults(indianData.results || [], type as MediaType);

  // Interleave and take top 6 for the hero
  return interleave(global, indian).slice(0, 6);
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
    return mapResults(results, type);
  }

  const currentYear = new Date().getFullYear();
  const targetYear = year || currentYear;

  if (region === "all" && (type === "movie" || type === "tv")) {
    // Fetch Hollywood and Indian content separately to interleave them
    const hollywoodParams = { 
      page, 
      include_adult: includeAdult,
      sort_by: 'popularity.desc',
      ...getRegionParams('hollywood'),
      [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: targetYear
    };
    
    const indianParams = { 
      page, 
      include_adult: includeAdult,
      sort_by: 'popularity.desc',
      region: 'IN',
      with_original_language: 'hi|te|ta|kn|ml|pa',
      [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: targetYear
    };

    const [hData, iData] = await Promise.all([
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, hollywoodParams),
      fetchFromProxy(`/discover/${type === 'movie' ? 'movie' : 'tv'}`, indianParams)
    ]);

    const hResults = mapResults(hData.results || [], type);
    const iResults = mapResults(iData.results || [], type);

    return interleave(hResults, iResults);
  }

  // Specific region or special category (Anime/K-Drama)
  let path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  let params: any = { 
    page, 
    include_adult: includeAdult,
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

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1, includeAdult: boolean = false): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  if (region === "all" && (type === "movie" || type === "tv")) {
    const hollywoodParams = {
      page,
      include_adult: includeAdult,
      sort_by: type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc',
      ...getRegionParams('hollywood'),
      [type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte']: today
    };

    const indianParams = {
      page,
      include_adult: includeAdult,
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