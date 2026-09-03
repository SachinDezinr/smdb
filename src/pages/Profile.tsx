"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCachedProfile, fetchProfileData, clearCachedProfile } from '@/lib/profileStore';
import { clearCachedStats, clearCachedSocialCircle } from '@/lib/pageDataStore';
import { getUserBadge } from '@/lib/badges';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { SecuritySection } from '@/components/profile/SecuritySection';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';
import { BadgeTiersModal } from '@/components/profile/BadgeTiersModal';

const Profile = () => {
  const cached = getCachedProfile();
  const [user, setUser] = useState<any>(cached?.user || null);
  const [username, setUsername] = useState(cached?.username || '');
  const [joinedDate, setJoinedDate] = useState<string>(cached?.joinedDate || '');
  const [pendingCount, setPendingCount] = useState(cached?.pendingCount || 0);
  const [friendsCount, setFriendsCount] = useState(cached?.friendsCount || 0);
  const [watchedCount, setWatchedCount] = useState(cached?.watchedCount || 0);
  const [pageLoading, setPageLoading] = useState(!cached);
  const [showTiersModal, setShowTiersModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      const data = await fetchProfileData(false);
      if (data) {
        setUser(data.user);
        setUsername(data.username);
        setJoinedDate(data.joinedDate);
        setPendingCount(data.pendingCount);
        setFriendsCount(data.friendsCount);
        setWatchedCount(data.watchedCount);
      }
      setPageLoading(false);
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    clearCachedProfile();
    clearCachedStats();
    clearCachedSocialCircle();
    await supabase.auth.signOut();
    navigate('/auth');
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