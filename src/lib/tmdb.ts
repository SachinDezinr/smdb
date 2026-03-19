export type MediaType = "movie" | "tv" | "anime" | "k-drama";
export type Region = "all" | "hollywood" | "bollywood" | "punjabi" | "south-indian" | "animated";

export interface ContentItem {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  media_type: MediaType;
  genre_ids: number[];
  overview: string;
  director?: string;
  cast?: string[];
}

const PROXY_URL = "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";

const getRegionParams = (region: Region) => {
  switch (region) {
    case "bollywood": return "&with_original_language=hi&region=IN";
    case "punjabi": return "&with_original_language=pa&region=IN";
    case "south-indian": return "&with_original_language=te|ta|kn|ml&region=IN";
    case "hollywood": return "&with_original_language=en&region=US";
    case "animated": return "&with_genres=16";
    default: return "";
  }
};

const fetchFromProxy = async (path: string, params: Record<string, string | number | boolean> = {}) => {
  const url = new URL(PROXY_URL);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  const response = await fetch(url.toString());
  return response.json();
};

export const fetchContent = async (
  type: MediaType,
  year?: number,
  page: number = 1,
  query: string = "",
  region: Region = "all",
  includeAdult: boolean = false
): Promise<ContentItem[]> => {
  let results: any[] = [];
  const currentYear = new Date().getFullYear();
  const adultParam = includeAdult;
  const animeAdultFilter = !includeAdult ? "190370" : "";

  if (query) {
    const multiData = await fetchFromProxy('/search/multi', { query, page, include_adult: adultParam });
    const personData = await fetchFromProxy('/search/person', { query, include_adult: adultParam });

    results = [...(multiData.results || [])];

    if (personData.results?.length > 0) {
      const personId = personData.results[0].id;
      const creditsData = await fetchFromProxy(`/person/${personId}/combined_credits`, { include_adult: adultParam });
      results = [...results, ...(creditsData.cast || []), ...(creditsData.crew || [])];
    }
  } else {
    let path = "";
    let params: any = { page, include_adult: adultParam };

    switch (type) {
      case "movie":
        path = '/discover/movie';
        params.primary_release_year = year || currentYear;
        params.sort_by = 'popularity.desc';
        break;
      case "tv":
        path = '/discover/tv';
        params.first_air_date_year = year || currentYear;
        params.sort_by = 'popularity.desc';
        break;
      case "anime":
        path = '/discover/tv';
        params.with_keywords = '210024';
        params.with_original_language = 'ja';
        params.first_air_date_year = year || currentYear;
        if (animeAdultFilter) params.without_keywords = animeAdultFilter;
        break;
      case "k-drama":
        path = '/discover/tv';
        params.with_original_language = 'ko';
        params.first_air_date_year = year || currentYear;
        break;
    }

    // Add region params manually since they are strings
    const regionStr = getRegionParams(region);
    const data = await fetchFromProxy(path, params);
    results = data.results || [];
  }

  const today = new Date().toISOString().split('T')[0];
  const seen = new Set();

  return results
    .map((item: any) => {
      let mediaType: MediaType = item.media_type || (type === 'movie' ? 'movie' : 'tv');
      if (item.first_air_date || item.name) mediaType = 'tv';
      if (item.release_date || item.title) mediaType = 'movie';

      return {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
        release_date: item.release_date || item.first_air_date || "TBA",
        vote_average: item.vote_average || 0,
        media_type: mediaType,
        genre_ids: item.genre_ids || [],
        overview: item.overview
      };
    })
    .filter((item: any) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      if (!item.poster_path && item.vote_average === 0) return false;
      if (!item.title) return false;
      if (query) return true;
      if (!year) return true;
      return item.release_date <= today;
    });
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/credits`);
  const director = data.crew?.find((c: any) => c.job === 'Director')?.name;
  const cast = data.cast?.slice(0, 5).map((c: any) => c.name);
  return { director, cast };
};

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1, includeAdult: boolean = false): Promise<ContentItem[]> => {
  let path = "";
  let params: any = { 
    page, 
    include_adult: includeAdult,
    sort_by: type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc'
  };
  
  const today = new Date().toISOString().split('T')[0];

  switch (type) {
    case "movie":
      path = '/discover/movie';
      params['primary_release_date.gte'] = today;
      break;
    case "tv":
      path = '/discover/tv';
      params['first_air_date.gte'] = today;
      break;
    case "anime":
      path = '/discover/tv';
      params.with_keywords = '210024';
      params.with_original_language = 'ja';
      params['first_air_date.gte'] = today;
      break;
    case "k-drama":
      path = '/discover/tv';
      params.with_original_language = 'ko';
      params['first_air_date.gte'] = today;
      break;
  }
    
  const data = await fetchFromProxy(path, params);
  return (data.results || [])
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      release_date: item.release_date || item.first_air_date || "TBA",
      vote_average: item.vote_average || 0,
      media_type: type,
      genre_ids: item.genre_ids || [],
      overview: item.overview
    }));
};