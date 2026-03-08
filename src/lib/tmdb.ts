const TMDB_API_KEY = "87ac1ac60056408dd1f46c65dbfc4a1f";
const BASE_URL = "https://api.themoviedb.org/3";

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

export const fetchContent = async (
  type: MediaType,
  year?: number,
  page: number = 1,
  query: string = "",
  region: Region = "all",
  includeAdult: boolean = false
): Promise<ContentItem[]> => {
  let url = "";
  const currentYear = new Date().getFullYear();
  const regionParams = getRegionParams(region);
  const adultParam = `&include_adult=${includeAdult}`;

  if (query) {
    // First, try searching for people (directors/cast)
    const personSearch = await fetch(`${BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const personData = await personSearch.json();
    
    if (personData.results?.length > 0) {
      const personId = personData.results[0].id;
      url = `${BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}`;
    } else {
      url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}${adultParam}`;
    }
  } else {
    switch (type) {
      case "movie":
        url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${year || currentYear}&sort_by=popularity.desc&page=${page}${regionParams}${adultParam}`;
        break;
      case "tv":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date_year=${year || currentYear}&sort_by=popularity.desc&page=${page}${regionParams}${adultParam}`;
        break;
      case "anime":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024&with_original_language=ja&first_air_date_year=${year || currentYear}&page=${page}${adultParam}`;
        break;
      case "k-drama":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&first_air_date_year=${year || currentYear}&page=${page}${adultParam}`;
        break;
    }
  }

  const response = await fetch(url);
  const data = await response.json();
  
  const results = data.results || data.cast || [];
  const today = new Date().toISOString().split('T')[0];

  // Filter out duplicates and items without poster AND rating
  const seen = new Set();
  return results
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      release_date: item.release_date || item.first_air_date || "TBA",
      vote_average: item.vote_average || 0,
      media_type: item.media_type || (type === 'movie' ? 'movie' : 'tv'),
      genre_ids: item.genre_ids || [],
      overview: item.overview
    }))
    .filter((item: any) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      
      // Rule: Do not show content that has no poster AND no IMDb rating
      if (!item.poster_path && item.vote_average === 0) return false;
      
      // Rule: When "All" is selected, show everything year-wise
      if (!year) return true;
      return item.release_date <= today;
    });
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const url = `${BASE_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  
  const director = data.crew?.find((c: any) => c.job === 'Director')?.name;
  const cast = data.cast?.slice(0, 5).map((c: any) => c.name);
  
  return { director, cast };
};

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1, includeAdult: boolean = false): Promise<ContentItem[]> => {
  const regionParams = getRegionParams(region);
  const adultParam = `&include_adult=${includeAdult}`;
  let url = "";
  
  switch (type) {
    case "movie":
      url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=primary_release_date.asc&page=${page}${regionParams}${adultParam}`;
      break;
    case "tv":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=first_air_date.asc&page=${page}${regionParams}${adultParam}`;
      break;
    case "anime":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024&with_original_language=ja&first_air_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=first_air_date.asc&page=${page}${adultParam}`;
      break;
    case "k-drama":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&first_air_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=first_air_date.asc&page=${page}${adultParam}`;
      break;
  }
    
  const response = await fetch(url);
  const data = await response.json();
  
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