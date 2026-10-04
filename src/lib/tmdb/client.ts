import { supabase } from '../supabase';

const PROXY_URL = "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_ENTRIES = 500;

type ProxyParams = Record<string, string | number | boolean>;

const cache = new Map<string, { data: unknown; timestamp: number }>();
const inFlight = new Map<string, Promise<any>>();
let activityScore = 0;
export const ACTIVITY_THRESHOLD = 3;

export const getActivityScore = () => activityScore;
export const incrementActivityScore = () => { activityScore++; };

/* ------------------------------ auth token ------------------------------ */

// Supabase tells us whenever the session changes (sign-in, sign-out, token refresh),
// so the token stays current instead of being captured once and reused after it expires.
let accessToken: string | null = null;
let tokenReady = false;
let initialLoad: Promise<void> | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  accessToken = session?.access_token ?? null;
  tokenReady = true;
});

const getAccessToken = async (): Promise<string | null> => {
  if (!tokenReady) {
    // Before the first auth event arrives, load the session once and share that call
    if (!initialLoad) {
      initialLoad = supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!tokenReady) {
            accessToken = data.session?.access_token ?? null;
            tokenReady = true;
          }
        })
        .catch(() => {})
        .finally(() => {
          initialLoad = null;
        });
    }
    await initialLoad;
  }
  return accessToken;
};

/* ------------------------------ cache ------------------------------ */

const readCache = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp >= CACHE_TTL) {
    cache.delete(key); // drop expired entries instead of keeping them forever
    return undefined;
  }
  return entry;
};

const writeCache = (key: string, data: unknown) => {
  cache.delete(key); // re-inserting moves the key to the end (newest)
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > MAX_CACHE_ENTRIES) {
    // Map iterates in insertion order, so the first key is the oldest entry
    cache.delete(cache.keys().next().value as string);
  }
};

/* ------------------------------ request ------------------------------ */

// Params are sorted, so {a, b} and {b, a} produce the same query (and the same cache key)
const buildQuery = (path: string, params: ProxyParams): string => {
  const search = new URLSearchParams({ path });
  for (const key of Object.keys(params).sort()) {
    search.set(key, String(params[key]));
  }
  return search.toString();
};

const send = async <T>(query: string): Promise<T> => {
  incrementActivityScore();

  const token = await getAccessToken();
  const response = await fetch(`${PROXY_URL}?${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to fetch from proxy (${response.status})`);
  }

  const data: T = await response.json();
  writeCache(query, data); // timestamp is taken when the response arrives
  return data;
};

export const fetchFromProxy = async <T = any>(
  path: string,
  params: ProxyParams = {}
): Promise<T> => {
  const key = buildQuery(path, params);

  const cached = readCache(key);
  if (cached) return cached.data as T;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = send<T>(key).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
};