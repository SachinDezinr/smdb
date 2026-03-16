"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Loader2, BarChart3, Target, Zap } from 'lucide-react';
import { ContentCard } from '@/components/content/ContentCard';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

const Compare = () => {
  const { friendId } = useParams();
  const [loading, setLoading] = useState(true);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [myCollection, setMyCollection] = useState<any[]>([]);
  const [friendCollection, setFriendCollection] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'common' | 'unique'>('all');

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !friendId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', friendId)
        .single();
      setFriendProfile(profile);

      const [myRes, friendRes] = await Promise.all([
        supabase.from('watched_content').select('*').eq('user_id', user.id),
        supabase.from('watched_content').select('*').eq('user_id', friendId)
      ]);

      setMyCollection(myRes.data || []);
      setFriendCollection(friendRes.data || []);
    } catch (err) {
      console.error("Comparison fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [friendId]);

  const toggleWatched = async (item: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCurrentlyWatched = myCollection.some(i => i.content_id === item.content_id);

    if (isCurrentlyWatched) {
      const { error } = await supabase
        .from('watched_content')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', item.content_id);

      if (!error) {
        setMyCollection(prev => prev.filter(i => i.content_id !== item.content_id));
        showSuccess("Removed from your collection");
      }
    } else {
      const { error } = await supabase
        .from('watched_content')
        .insert({
          user_id: user.id,
          content_id: item.content_id,
          title: item.title,
          poster_path: item.poster_path,
          release_date: item.release_date,
          vote_average: item.vote_average,
          media_type: item.media_type
        });

      if (!error) {
        setMyCollection(prev => [...prev, item]);
        showSuccess("Added to your collection");
      }
    }
  };

  const addToWatchlist = async (item: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        content_id: item.content_id,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        media_type: item.media_type
      });

    if (!error) showSuccess("Added to your watchlist");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  const myIds = new Set(myCollection.map(i => i.content_id));
  const commonItems = friendCollection.filter(i => myIds.has(i.content_id));
  const uniqueToFriend = friendCollection.filter(i => !myIds.has(i.content_id));
  
  const compatibility = friendCollection.length > 0 
    ? Math.round((commonItems.length / friendCollection.length) * 100) 
    : 0;

  const displayedItems = filter === 'common' ? commonItems : filter === 'unique' ? uniqueToFriend : friendCollection;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <motion.header 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-10"
        >
          <Link to="/friends" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft size={18} /> Back to Friends
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold">
                Comparing with <span className="text-primary">{friendProfile?.username || 'Friend'}</span>
              </h1>
              <p className="text-muted-foreground mt-2">Discover what you both love and what's unique.</p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {['all', 'common', 'unique'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => setFilter(btn as any)}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                    filter === btn ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {btn.charAt(0).toUpperCase() + btn.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary"><Target size={24} /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Compatibility</p>
              <p className="text-2xl font-serif font-bold">{compatibility}%</p>
            </div>
          </div>
          <div className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Zap size={24} /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Similar Interests</p>
              <p className="text-2xl font-serif font-bold">{commonItems.length} Items</p>
            </div>
          </div>
          <div className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><Users size={24} /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unique to {friendProfile?.username}</p>
              <p className="text-2xl font-serif font-bold">{uniqueToFriend.length} Items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayedItems.map((item) => {
            const isCommon = myIds.has(item.content_id);
            return (
              <ContentCard 
                key={item.content_id} 
                item={{
                  id: item.content_id,
                  title: item.title,
                  poster_path: item.poster_path,
                  release_date: item.release_date,
                  vote_average: item.vote_average,
                  media_type: item.media_type as any,
                  genre_ids: [],
                  overview: ""
                }} 
                isWatched={isCommon}
                isSimilar={isCommon}
                showWatchlistButton={!isCommon}
                onToggleWatched={() => toggleWatched(item)}
                onToggleWatchlist={() => addToWatchlist(item)}
                variant="compare"
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Compare;