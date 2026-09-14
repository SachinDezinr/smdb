"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCachedProfile, fetchProfileData, clearCachedProfile, setCachedAuthState } from '@/lib/profileStore';
import { clearCachedStats, clearCachedSocialCircle } from '@/lib/pageDataStore';
import { getUserBadge } from '@/lib/badges';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { SecuritySection } from '@/components/profile/SecuritySection';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';
import { BadgeTiersModal } from '@/components/profile/BadgeTiersModal';

const Profile = () => {
  // Lazy initializers: getCachedProfile() now runs once at mount instead of
  // on every re-render (this component re-renders on every field edit,
  // badge modal toggle, etc - the original read the cache each time for
  // values only the first render actually used).
  const [user, setUser] = useState<any>(() => getCachedProfile()?.user || null);
  const [username, setUsername] = useState(() => getCachedProfile()?.username || '');
  const [joinedDate, setJoinedDate] = useState<string>(() => getCachedProfile()?.joinedDate || '');
  const [pendingCount, setPendingCount] = useState(() => getCachedProfile()?.pendingCount || 0);
  const [friendsCount, setFriendsCount] = useState(() => getCachedProfile()?.friendsCount || 0);
  const [watchedCount, setWatchedCount] = useState(() => getCachedProfile()?.watchedCount || 0);
  const [pageLoading, setPageLoading] = useState(() => !getCachedProfile());
  const [showTiersModal, setShowTiersModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const data = await fetchProfileData(false);
      if (!isMounted) return;

      if (data) {
        setUser(data.user);
        setUsername(data.username);
        setJoinedDate(data.joinedDate);
        setPendingCount(data.pendingCount);
        setFriendsCount(data.friendsCount);
        setWatchedCount(data.watchedCount);
        setPageLoading(false);
      } else {
        // No session (or the fetch failed) - this page requires auth, so
        // don't leave the user on a blank page. Note: if fetchProfileData
        // returns the same falsy value for "no session" and "network error",
        // this will also redirect a logged-in user on a transient failure -
        // worth confirming that distinction on your end.
        navigate(`/login?return_to=${encodeURIComponent('/profile')}`);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    clearCachedProfile();
    clearCachedStats();
    clearCachedSocialCircle();
    setCachedAuthState(false);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      navigate('/login');
    }
  };

  const currentBadge = user ? getUserBadge(watchedCount).current : null;

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />

      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-5xl mx-auto w-full">
        {pageLoading && !user ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={44} />
          </div>
        ) : user ? (
          <>
            {/* Page Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                <Sparkles size={14} /> Account & Preferences
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Settings & <span className="text-primary">Profile</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your account credentials, social connections, and system preferences.
              </p>
            </header>

            {/* Hero Section */}
            <ProfileHero
              user={user}
              username={username}
              joinedDate={joinedDate}
              watchedCount={watchedCount}
              friendsCount={friendsCount}
              pendingCount={pendingCount}
              onOpenBadgeModal={() => setShowTiersModal(true)}
            />

            {/* Setting Cards Sections */}
            <div className="space-y-6">
              <PersonalInfoSection
                user={user}
                initialUsername={username}
                onUsernameUpdated={(newUsername) => setUsername(newUsername)}
              />

              <SecuritySection />

              <SocialLinksSection pendingCount={pendingCount} />

              <DangerZoneSection onLogout={handleLogout} />
            </div>
          </>
        ) : null}
      </main>

      {/* Badge Tiers Modal */}
      {currentBadge && (
        <BadgeTiersModal
          isOpen={showTiersModal}
          onClose={() => setShowTiersModal(false)}
          currentBadge={currentBadge}
          watchedCount={watchedCount}
        />
      )}
    </div>
  );
};

export default Profile;