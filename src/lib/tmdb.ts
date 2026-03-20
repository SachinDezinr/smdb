"use client";

const TMDB_API_KEY = "a52b6bf7cad83e446632082393efa4dd";
const BASE_URL = "https://api.themoviedb.org/3";

export type MediaType = "movie" | "tv" | "anime" | "k-drama";
export type Region = "all" | "hollywood" | "bollywood" | "punjabi" | "south-indian" | "animated" | "korean";

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

const getRegionParams = (region: Region, isUpcoming: boolean = false) => {
  const releaseType = isUpcoming ? "" : "&with_release_type=2|3";
  
  switch (region) {
    case "bollywood": return `&with_original_language=hi&region=IN${releaseType}`;
    case "punjabi": return `&with_original_language=pa&region=IN${releaseType}`;
    case "south-indian": return `&with_original_language=te|ta|kn|ml&region=IN${releaseType}`;
    case "hollywood": 
      // For upcoming, we remove region=US to be more inclusive of global English releases
      return isUpcoming ? `&with_original_language=en` : `&with_original_language=en&region=US${releaseType}`;
    case "korean": return `&with_original_language=ko&region=KR`;
    case "animated": return `&with_genres=16`;
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
  let results: any[] = [];
  const currentYear = new Date().getFullYear();
  const regionParams = getRegionParams(region);
  const adultParam = `&include_adult=${includeAdult}`;
  const animeAdultFilter = !includeAdult ? "&without_keywords=190370" : "";

  if (query) {
    const [multiRes, personRes] = await Promise.all([
      fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}${adultParam}`),
      fetch(`${BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}${adultParam}`)
    ]);

    const multiData = await multiRes.json();
    const personData = await personRes.json();

    results = [...(multiData.results || [])];

    if (personData.results?.length > 0) {
      const personId = personData.results[0].id;
      const creditsRes = await fetch(`${BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}${adultParam}`);
      const creditsData = await creditsRes.json();
      
      const personCredits = [
        ...(creditsData.cast || []),
        ...(creditsData.crew || [])
      ];
      
      results = [...results, ...personCredits];
    }
  } else {
    let url = "";
    switch (type) {
      case "movie":
        url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${year || currentYear}&sort_by=popularity.desc&page=${page}${regionParams}${adultParam}`;
        break;
      case "tv":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date_year=${year || currentYear}&sort_by=popularity.desc&page=${page}${regionParams}${adultParam}`;
        break;
      case "anime":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024&with_original_language=ja&first_air_date_year=${year || currentYear}&page=${page}${adultParam}${animeAdultFilter}`;
        break;
      case "k-drama":
        url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&first_air_date_year=${year || currentYear}&page=${page}${adultParam}`;
        break;
    }
    const response = await fetch(url);
    const data = await response.json();
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
        backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "",
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
      if (item.release_date === "TBA") return false;
      
      // Allow future dates if we are specifically looking for a future year (like 2027)
      if (year && year > currentYear) return true;
      
      return item.release_date <= today;
    })
    .sort((a, b) => {
      if (a.release_date === "TBA") return 1;
      if (b.release_date === "TBA") return -1;
      return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
    });
};

export const fetchTrending = async (): Promise<ContentItem[]> => {
  const url = `${BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  const today = new Date().toISOString().split('T')[0];

  return (data.results || [])
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "",
      release_date: item.release_date || item.first_air_date || "TBA",
      vote_average: item.vote_average || 0,
      media_type: item.media_type || 'movie',
      genre_ids: item.genre_ids || [],
      overview: item.overview
    }))
    .filter((item: any) => item.release_date <= today);
};

export const fetchTrailers = async (id: number, type: 'movie' | 'tv'): Promise<string | null> => {
  const url = `${BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  const trailer = data.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
};

export const smartWarmCache = () => {
  fetchTrending();
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
  const regionParams = getRegionParams(region, true);
  const adultParam = `&include_adult=${includeAdult}`;
  let url = "";
  
  const today = new Date().toISOString().split('T')[0];

  switch (type) {
    case "movie":
      url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&release_date.gte=${today}&sort_by=release_date.asc&page=${page}${regionParams}${adultParam}`;
      break;
    case "tv":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date.gte=${today}&sort_by=first_air_date.asc&page=${page}${regionParams}${adultParam}`;
      break;
    case "anime":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024&with_original_language=ja&first_air_date.gte=${today}&sort_by=first_air_date.asc&page=${page}${adultParam}`;
      break;
    case "k-drama":
      url = `${BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&first_air_date.gte=${today}&sort_by=first_air_date.asc&page=${page}${adultParam}`;
      break;
  }
    
  const response = await fetch(url);
  const data = await response.json();
  return (data.results || [])
    .map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : "",
      release_date: item.release_date || item.first_air_date || "TBA",
      vote_average: item.vote_average || 0,
      media_type: type,
      genre_ids: item.genre_ids || [],
      overview: item.overview
    }))
    .filter((item: any) => item.release_date >= today || item.release_date === "TBA");
};