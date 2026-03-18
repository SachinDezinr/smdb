"use client";

const API_KEY = 'a52b6bf7cad83e446632082393efa4dd';
const BASE_URL = 'https://api.themoviedb.org/3';

export type MediaType = 'movie' | 'tv' | 'anime' | 'k-drama';
export type Region = 'all' | 'hollywood' | 'bollywood' | 'punjabi' | 'south-indian' | 'animated' | 'korean';

export interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
  };
}

export const fetchContentDetails = async (id: number, type: 'movie' | 'tv'): Promise<ContentItem> => {
  const response = await fetch(
    `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,release_dates`
  );
  if (!response.ok) throw new Error('Failed to fetch details');
  const data = await response.json();

  let releaseDate = type === 'movie' ? data.release_date : data.first_air_date;

  if (type === 'movie' && data.release_dates) {
    const results = data.release_dates.results;
    const indiaRelease = results.find((r: any) => r.iso_3166_1 === 'IN');
    const globalRelease = results.find((r: any) => r.iso_3166_1 === 'US') || results[0];
    const findTheatrical = (country: any) => 
      country?.release_dates.find((rd: any) => rd.type === 3 || rd.type === 2)?.release_date;
    const inDate = findTheatrical(indiaRelease);
    const globalDate = findTheatrical(globalRelease);
    releaseDate = inDate || globalDate || releaseDate;
  }

  return {
    ...data,
    media_type: type,
    release_date: releaseDate?.split('T')[0]
  };
};

export const fetchContent = async (
  type: MediaType, 
  year?: number, 
  page: number = 1, 
  query: string = "", 
  region: Region = 'all'
): Promise<ContentItem[]> => {
  let url = `${BASE_URL}/discover/${type === 'movie' || type === 'anime' ? 'movie' : 'tv'}?api_key=${API_KEY}&page=${page}`;
  
  if (query) {
    url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  } else {
    if (year) {
      const yearParam = type === 'movie' || type === 'anime' ? 'primary_release_year' : 'first_air_date_year';
      url += `&${yearParam}=${year}`;
    }
    
    // Region/Language filters
    if (region === 'bollywood') url += '&with_original_language=hi';
    if (region === 'punjabi') url += '&with_original_language=pa';
    if (region === 'south-indian') url += '&with_original_language=te|ta|kn|ml';
    if (region === 'korean' || type === 'k-drama') url += '&with_original_language=ko';
    if (type === 'anime') url += '&with_keywords=210024|287501'; // Anime keywords
  }

  const response = await fetch(url);
  const data = await response.json();
  return (data.results || []).map((item: any) => ({
    ...item,
    media_type: item.media_type || (type === 'tv' || type === 'k-drama' ? 'tv' : 'movie')
  }));
};

export const fetchUpcoming = async (category: MediaType = 'movie', region: Region = 'all', page: number = 1): Promise<ContentItem[]> => {
  const type = category === 'tv' || category === 'k-drama' ? 'tv' : 'movie';
  let url = `${BASE_URL}/${type}/upcoming?api_key=${API_KEY}&page=${page}`;
  
  if (region === 'bollywood') url += '&region=IN&with_original_language=hi';
  else if (region === 'hollywood') url += '&region=US';
  
  const response = await fetch(url);
  if (!response.ok) return fetchContent(category, new Date().getFullYear() + 1, page, "", region);
  const data = await response.json();
  return (data.results || []).map((item: any) => ({ ...item, media_type: type }));
};

export const fetchTrending = async (): Promise<ContentItem[]> => {
  const response = await fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}`);
  const data = await response.json();
  return (data.results || []).filter((i: any) => i.media_type !== 'person');
};

export const fetchTrailers = async (id: number, type: 'movie' | 'tv'): Promise<string | null> => {
  const response = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
  const data = await response.json();
  const trailer = (data.results || []).find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv'): Promise<{ director?: string; cast?: string[] }> => {
  const response = await fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`);
  const data = await response.json();
  const director = (data.crew || []).find((c: any) => c.job === 'Director')?.name;
  const cast = (data.cast || []).slice(0, 5).map((c: any) => c.name);
  return { director, cast };
};

export const smartWarmCache = () => {
  console.log("[tmdb] Warming cache...");
};

export const searchContent = async (query: string): Promise<ContentItem[]> => {
  const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Search failed');
  const data = await response.json();
  return data.results.filter((item: any) => item.media_type !== 'person');
};