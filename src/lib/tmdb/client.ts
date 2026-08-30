import { supabase } from '../supabase';

const PROXY_URL = "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

let cachedSession: any = null;
const cache = new Map<string, { data: any; timestamp: number }>();
const inFlight = new Map<string, Promise<any>>();
let activityScore = 0;
export const ACTIVITY_THRESHOLD = 3;

export const getActivityScore = () => activityScore;
export const incrementActivityScore = () => { activityScore++; };

export const fetchFromProxy = async (
  path: string, 
  params: Record<string, string | number | boolean> = {}
): Promise<any> => {
  const cacheKey = JSON.stringify({ path, params });
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  if (inFlight.has(cacheKey)) {
    return inFlight.get(cacheKey);
  }

  const requestPromise = (async () => {
    incrementActivityScore();
    
    if (!cachedSession) {
      const { data: { session } } = await supabase.auth.getSession();
      cachedSession = session;
    }
    
    const url = new URL(PROXY_URL);
    url.searchParams.set('path', path);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${cachedSession?.access_token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch from proxy');
    }
    
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  })();

  inFlight.set(cacheKey, requestPromise);
  
  try {
    return await requestPromise;
  } finally {
    inFlight.delete(cacheKey);
  }
};