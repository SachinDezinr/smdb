const TMDB_API_KEY = "87ac1ac60056408dd1f46c65dbfc4a1f";
const BASE_URL = "https://api.themoviedb.org/3";

export type MediaType = "movie" | "tv" | "anime" | "k-drama";

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

export const fetchContent = async (
  type: MediaType,
  year?: number,
  page: number = 1,
  query: string = ""
): Promise<ContentItem[]> => {
  let url = "";
  const currentYear = new Date().getFullYear();

  if (query) {
    url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  } else {
    switch (type) {
      case "movie":
        url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${year || currentYear}&sort_by=popularity.desc&page=${page}`;
        break;
      case "tv":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date_year=${year || currentYear}&sort_by=popularity.desc&page=${page}`;
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
  
  return (data.results || []).map((item: any) => ({
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

export const fetchUpcoming = async (type: MediaType = "movie"): Promise<ContentItem[]> => {
  const url = type === "movie" 
    ? `${BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}`
    : `${BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}`;
    
  const response = await fetch(url);
  const data = await response.json();
  
  return (data.results || []).map((item: any) => ({
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