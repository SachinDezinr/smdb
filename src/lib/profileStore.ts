import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface ProfileData {
  user: User;
  username: string;
  joinedDate: string;
  pendingCount: number;
  friendsCount: number;
  watchedCount: number;
}

const CACHE_TTL = 3 * 60 * 1000;

let cachedProfile: ProfileData | null = null;
let cachedAuthState: boolean | null = null;
let lastFetched = 0;

export const getCachedProfile = (): ProfileData | null => cachedProfile;

export const getCachedAuthState = (): boolean | null => {
  if (cachedAuthState !== null) {
    return cachedAuthState;
  }

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (!key || (!key.includes("supabase.auth.token") && !key.startsWith("sb-"))) {
        continue;
      }

      const value = localStorage.getItem(key);

      if (value?.includes("access_token") || value?.includes("user")) {
        cachedAuthState = true;
        return true;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const setCachedAuthState = (isAuthenticated: boolean): void => {
  cachedAuthState = isAuthenticated;
};

export const setCachedProfile = (
  data: Partial<ProfileData>,
): void => {
  if (!cachedProfile) return;

  cachedProfile = {
    ...cachedProfile,
    ...data,
  };
};

export const isProfileCacheValid = (): boolean =>
  cachedProfile !== null &&
  Date.now() - lastFetched < CACHE_TTL;

export const fetchProfileData = async (
  force = false,
): Promise<ProfileData | null> => {
  if (!force && isProfileCacheValid()) {
    return cachedProfile;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    cachedAuthState = false;
    cachedProfile = null;
    return null;
  }

  cachedAuthState = true;

  const [pendingResult, friendsResult, watchedResult] =
    await Promise.all([
      supabase
        .from("friends")
        .select("id", { count: "exact", head: true })
        .eq("friend_id", user.id)
        .eq("status", "pending"),

      supabase
        .from("friends")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "accepted"),

      supabase
        .from("watched_content")
        .select("content_id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const profileData: ProfileData = {
    user,
    username:
      typeof user.user_metadata?.username === "string"
        ? user.user_metadata.username
        : "",
    joinedDate: user.created_at
      ? new Date(user.created_at).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : "",
    pendingCount: pendingResult.count ?? 0,
    friendsCount: friendsResult.count ?? 0,
    watchedCount: watchedResult.count ?? 0,
  };

  cachedProfile = profileData;
  lastFetched = Date.now();

  return profileData;
};

export const clearCachedProfile = (): void => {
  cachedProfile = null;
  cachedAuthState = false;
  lastFetched = 0;
};