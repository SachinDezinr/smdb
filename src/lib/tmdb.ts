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

export const fetchTrending = async (): Promise<ContentItem[]> => {
  const [globalMovies, indianMovies, globalTv, anime, kdrama] = await Promise.all([
    fetchFromProxy('/trending/movie/week'),
    fetchFromProxy('/discover/movie', { region: 'IN', with_original_language: 'hi|te|ta|kn|ml', sort_by: 'popularity.desc' }),
    fetchFromProxy('/trending/tv/week'),
    fetchFromProxy('/discover/tv', { with_keywords: '210024', with_original_language: 'ja', sort_by: 'popularity.desc' }),
    fetchFromProxy('/discover/tv', { with_original_language: 'ko', sort_by: 'popularity.desc' })
  ]);

  const gm = mapResults(globalMovies.results || [], 'movie');
  const im = mapResults(indianMovies.results || [], 'movie');
  const gt = mapResults(globalTv.results || [], 'tv');
  const an = mapResults(anime.results || [], 'anime');
  const kd = mapResults(kdrama.results || [], 'k-drama');

  const movies = interleave(gm, im);
  const others = interleave(gt, interleave(an, kd));
  
  return interleave(movies, others).slice(0, 12);
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