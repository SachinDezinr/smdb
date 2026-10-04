import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";

const PROXY_URL =
  "https://umkupiqsoblxkrxyaqst.supabase.co/functions/v1/tmdb-proxy";

const CACHE_TTL = 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type QueryValue = string | number | boolean;

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

let cachedSession: Session | null = null;
let activityScore = 0;

export const ACTIVITY_THRESHOLD = 3;

const getCacheKey = (
  path: string,
  params: Record<string, QueryValue>,
): string => {
  const sortedParams = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return JSON.stringify({
    path,
    params: sortedParams,
  });
};

const getSession = async (): Promise<Session | null> => {
  if (cachedSession) {
    return cachedSession;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  cachedSession = session;
  return session;
};

const handleAuthChange = (session: Session | null): void => {
  cachedSession = session;
};

supabase.auth.onAuthStateChange((_event, session) => {
  handleAuthChange(session);
});

export const getActivityScore = (): number => activityScore;

export const incrementActivityScore = (): void => {
  activityScore += 1;
};

export const resetActivityScore = (): void => {
  activityScore = 0;
};

export const clearProxyCache = (): void => {
  cache.clear();
};

export const invalidateProxyCache = (path?: string): void => {
  if (!path) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(`"path":"${path}"`)) {
      cache.delete(key);
    }
  }
};

export const pruneProxyCache = (): void => {
  const now = Date.now();

  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      cache.delete(key);
    }
  }
};

export async function fetchFromProxy<T = unknown>(
  path: string,
  params: Record<string, QueryValue> = {},
  signal?: AbortSignal,
): Promise<T> {
  pruneProxyCache();

  const cacheKey = getCacheKey(path, params);
  const now = Date.now();

  const cached = cache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const existingRequest = inFlight.get(cacheKey);

  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = (async (): Promise<T> => {
    incrementActivityScore();

    const session = await getSession();

    const url = new URL(PROXY_URL);
    url.searchParams.set("path", path);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
        ...(session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {}),
      },
    });

    if (!response.ok) {
      let message = `TMDB proxy request failed (${response.status})`;

      try {
        const error = (await response.json()) as {
          error?: string;
          message?: string;
        };

        message = error.error || error.message || message;
      } catch {
        // Keep the HTTP status message when the response is not JSON.
      }

      throw new Error(message);
    }

    const data = (await response.json()) as T;

    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  })();

  inFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlight.delete(cacheKey);
  }
}