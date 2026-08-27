import { supabase } from './supabase';

let collectionCache: any[] | null = null;
let lastFetchedTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const getCachedCollection = () => collectionCache;

export const setCachedCollection = (items: any[]) => {
  collectionCache = items;
  lastFetchedTime = Date.now();
};

export const fetchUserCollection = async (force = false): Promise<any[]> => {
  const now = Date.now();
  if (!force && collectionCache !== null && now - lastFetchedTime < CACHE_TTL) {
    return collectionCache;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return collectionCache || [];

  const { data, error } = await supabase
    .from('watched_content')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!error && data) {
    collectionCache = data;
    lastFetchedTime = now;
    return data;
  }

  return collectionCache || [];
};

export const removeCollectionItem = (contentId: number) => {
  if (collectionCache) {
    collectionCache = collectionCache.filter(item => item.content_id !== contentId);
  }
};

export const addCollectionItem = (item: any) => {
  if (collectionCache) {
    const exists = collectionCache.some(i => i.content_id === item.content_id);
    if (!exists) {
      collectionCache = [item, ...collectionCache];
    }
  }
};