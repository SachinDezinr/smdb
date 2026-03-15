"use client";

import { supabase } from './supabase';

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
  status?: string;
}

const PROXY_URL = "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";

// Simple cache to speed up repeated requests
const cache = new Map();

async function fetchFromProxy(path: string, params: Record<string, string | number> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const url = new URL(PROXY_URL);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  const cacheKey = url.toString();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch from proxy');
  const data = await response.json();
  
  cache.set(cacheKey, data);
  return data;
}

export const fetchTrending = async (): Promise<ContentItem[]> => {
  const data = await fetchFromProxy('/trending/all/day');
  return data.results.map((item: any) => ({
    id: item.id,
    title: item.title || item.name,
    poster_path: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
    backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
    release_date: item.release_date || item.first_air_date || 'TBA',
    vote_average: item.vote_average,
    media_type: item.media_type || 'movie',
    genre_ids: item.genre_ids,
    overview: item.overview
  }));
};

export const fetchUpcoming = async (type: MediaType = 'movie', region: Region = 'all', page: number = 1): Promise<ContentItem[]> => {
  const today = new Date().toISOString().split('T')[0];
  const params: any = { 
    page,
    'release_date.gte': today,
    sort_by: 'release_date.asc'
  };

  if (region !== 'all') {
    switch (region) {
      case 'hollywood': params.with_original_language = 'en'; break;
      case 'bollywood': params.with_original_language = 'hi'; break;
      case 'punjabi': params.with_original_language = 'pa'; break;
      case 'south-indian': params.with_original_language = 'te|ta|kn|ml'; break;
      case 'animated': params.with_genres = '16'; break;
      case 'korean': params.with_original_language = 'ko'; break;
    }
  }

  const path = type === 'movie' ? '/discover/movie' : '/discover/tv';
  const data = await fetchFromProxy(path, params);
  
  return data.results.map((item: any) => ({
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
    release_date: item.release_date || item.first_air_date || 'TBA',
    vote_average: item.vote_average,
    media_type: type,
    genre_ids: item.genre_ids,
    overview: item.overview,
    status: 'Upcoming'
  }));
};

export const fetchContent = async (type: MediaType, year?: number, page: number = 1, query: string = "", region: Region = "all"): Promise<ContentItem[]> => {
  let path = query ? '/search/multi' : (type === 'movie' ? '/discover/movie' : '/discover/tv');
  const params: any = { page };
  
  if (query) {
    params.query = query;
  } else {
    if (year) {
      const yearParam = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
      params[yearParam] = year;
    }
    
    if (region !== 'all') {
      switch (region) {
        case 'hollywood': params.with_original_language = 'en'; break;
        case 'bollywood': params.with_original_language = 'hi'; break;
        case 'punjabi': params.with_original_language = 'pa'; break;
        case 'south-indian': params.with_original_language = 'te|ta|kn|ml'; break;
        case 'animated': params.with_genres = '16'; break;
        case 'korean': params.with_original_language = 'ko'; break;
      }
    }
  }

  const data = await fetchFromProxy(path, params);
  return data.results.map((item: any) => ({
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
    release_date: item.release_date || item.first_air_date || 'TBA',
    vote_average: item.vote_average,
    media_type: item.media_type || type,
    genre_ids: item.genre_ids,
    overview: item.overview
  }));
};

export const fetchTrailers = async (id: number, type: 'movie' | 'tv'): Promise<string | null> => {
  const data = await fetchFromProxy(`/${type}/${id}/videos`);
  const trailer = data.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
};

export const fetchCredits = async (id: number, type: 'movie' | 'tv') => {
  const data = await fetchFromProxy(`/${type}/${id}/credits`);
  const director = data.crew?.find((c: any) => c.job === 'Director')?.name;
  const cast = data.cast?.slice(0, 3).map((c: any) => c.name);
  return { director, cast };
};

export const smartWarmCache = () => {
  fetchTrending();
};