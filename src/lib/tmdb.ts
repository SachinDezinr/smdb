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
  region: Region = "all"
): Promise<ContentItem[]> => {
  let url = "";
  const currentYear = new Date().getFullYear();
  const regionParams = getRegionParams(region);

  if (query) {
    url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  } else {
    switch (type) {
      case "movie":
        url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${year || currentYear}&sort_by=popularity.desc&page=${page}${regionParams}`;
        break;
      case "tv":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date_year=${year || currentYear}&sort_by=popularity.desc&page=${page}${regionParams}`;
        break;
      case "anime":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024&with_original_language=ja&first_air_date_year=${year || currentYear}&page=${page}`;
        break;
      case "k-drama":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&first_air_date_year=${year || currentYear}&page=${page}`;
        break;
    }
  }

  const response = await fetch(url);
  const data = await response.json();
  
  const today = new Date().toISOString().split('T')[0];

  return (data.results || [])
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.svg",
      release_date: item.release_date || item.first_air_date || "TBA",
      vote_average: item.vote_average,
      media_type: type,
      genre_ids: item.genre_ids || [],
      overview: item.overview
    }))
    .filter((item: any) => !year || item.release_date <= today);
};

export const fetchUpcoming = async (type: MediaType = "movie", region: Region = "all", page: number = 1): Promise<ContentItem[]> => {
  const regionParams = getRegionParams(region);
  let url = "";
  
  switch (type) {
    case "movie":
      url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=primary_release_date.asc&page=${page}${regionParams}`;
      break;
    case "tv":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=first_air_date.asc&page=${page}${regionParams}`;
      break;
    case "anime":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024&with_original_language=ja&first_air_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=first_air_date.asc&page=${page}`;
      break;
    case "k-drama":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&first_air_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=first_air_date.asc&page=${page}`;
      break;
  }
    
  const response = await fetch(url);
  const data = await response.json();
  
  return (data.results || [])
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/placeholder.svg",
      release_date: item.release_date || item.first_air_date || "TBA",
      vote_average: item.vote_average,
      media_type: type,
      genre_ids: item.genre_ids || [],
      overview: item.overview
    }));
};