"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Loader2, CheckCircle2, Plus, Film, Tv, Sparkles, Heart, ChevronUp } from 'lucide-react';
import { ContentCard } from '@/components/content/ContentCard';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

const Compare = () => {
  const { friendId } = useParams();
  const [loading, setLoading] = useState(true);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [myCollection, setMyCollection] = useState<any[]>([]);
  const [friendCollection, setFriendCollection] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'common' | 'unique'>('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const [myIds, setMyIds] = useState<Set<number>>(new Set());

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
      setMyIds(new Set((myRes.data || []).map(i => i.content_id)));
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

    const isCurrentlyWatched = myIds.has(item.content_id);

    if (isCurrentlyWatched) {
      const { error } = await supabase
        .from('watched_content')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', item.content_id);

      if (!error) {
        setMyIds(prev => {
          const next = new Set(prev);
          next.delete(item.content_id);
          return next;
        });
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
        setMyIds(prev => {
          const next = new Set(prev);
          next.add(item.content_id);
          return next;
        });
        showSuccess("Added to your collection!");
      } else {
        showError("Failed to add content");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  const commonItems = friendCollection.filter(i => myIds.has(i.content_id));
  const uniqueToFriend = friendCollection.filter(i => !myIds.has(i.content_id));

  const filteredItems = filter === 'common' ? commonItems : filter === 'unique' ? uniqueToFriend : friendCollection;
  const displayedItems = filteredItems.slice(0, visibleCount);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <ScrollToTop />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <Link to="/friends" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft size={18} /> Back to Friends
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold">
                Comparing with <span className="text-primary">{friendProfile?.username || 'Friend'}</span>
              </h1>
              <p className="text-muted-foreground mt-2">Discover shared tastes and new recommendations.</p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {[
                { id: 'all', label: 'All' },
                { id: 'common', label: 'Common' },
                { id: 'unique', label: 'Unique' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => { setFilter(btn.id as any); setVisibleCount(12); }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                    filter === btn.id ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            key={`common-${commonItems.length}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="glass-card p-6 border-primary/20 cinematic-glow text-center"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Common Interests</p>
            <p className="text-4xl font-bold text-primary">{commonItems.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Titles you both watched</p>
          </motion.div>
          <motion.div 
            key={`unique-${uniqueToFriend.length}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="glass-card p-6 border-white/5 text-center"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Friend's Unique</p>
            <p className="text-4xl font-bold text-white">{uniqueToFriend.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Recommendations for you</p>
          </motion.div>
          <motion.div 
            key={`compat-${commonItems.length}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="glass-card p-6 border-white/5 text-center"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Compatibility</p>
            <p className="text-4xl font-bold text-white">
              {friendCollection.length > 0 
                ? Math.round((commonItems.length / friendCollection.length) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">Based on {friendProfile?.username || 'their'} list</p>
          </motion.div>
        </div>

        {displayedItems.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Users size={64} className="mx-auto mb-4" />
            <p className="text-xl">No items found for this filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedItems.map((item) => (
                <div key={item.content_id} className="relative group">
                  <ContentCard 
                    item={{
                      id: item.content_id,
                      title: item.title,
                      poster_path: item.poster_path,
                      release_date: item.release_date,
                      vote_average: item.vote_average,
                      media_type: item.media_type,
                      genre_ids: [],
                      overview: ""
                    }} 
                    isWatched={myIds.has(item.content_id)}
                    onToggleWatched={() => toggleWatched(item)}
                  />
                  {myIds.has(item.content_id) && (
                    <div className="absolute top-2 left-2 bg-primary/90 text-black px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-lg z-10">
                      <CheckCircle2 size={10} /> Shared
                    </div>
                  )}
                </div>
              ))}
            </div>

            {visibleCount < filteredItems.length && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="flex items-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-sm border border-white/10"
                >
                  <Plus size={20} />
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Compare;