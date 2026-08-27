import { supabase } from './supabase';

export interface ProfileData {
  user: any;
  username: string;
  joinedDate: string;
  pendingCount: number;
  friendsCount: number;
  watchedCount: number;
}

let cachedProfile: ProfileData | null = null;
let lastFetched = 0;
const CACHE_TTL = 1000 * 60 * 3; // 3 minutes

export const getCachedProfile = (): ProfileData | null => cachedProfile;

export const setCachedProfile = (data: Partial<ProfileData>) => {
  if (!cachedProfile) return;
  cachedProfile = { ...cachedProfile, ...data };
};

export const fetchProfileData = async (force = false): Promise<ProfileData | null> => {
  const now = Date.now();
  if (!force && cachedProfile && now - lastFetched < CACHE_TTL) {
    return cachedProfile;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let joinedDate = '';
  if (user.created_at) {
    const date = new Date(user.created_at);
    joinedDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  const [pendingRes, friendsRes, watchedRes] = await Promise.all([
    supabase
      .from('friends')
      .select('id')
      .eq('friend_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('friends')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'accepted'),
    supabase
      .from('watched_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
  ]);

  const profileData: ProfileData = {
    user,
    username: user.user_metadata?.username || '',
    joinedDate,
    pendingCount: pendingRes.data?.length || 0,
    friendsCount: friendsRes.data?.length || 0,
    watchedCount: watchedRes.count || 0
  };

  cachedProfile = profileData;
  lastFetched = now;
  return profileData;
};

export const clearCachedProfile = () => {
  cachedProfile = null;
  lastFetched = 0;
};