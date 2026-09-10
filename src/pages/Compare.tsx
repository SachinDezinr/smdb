"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Loader2, Plus, ChevronUp, Sparkles, Film } from 'lucide-react';
import { ContentCard } from '@/components/content/ContentCard';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { toast } from 'sonner';

const Compare = () => {
  const { friendId } = useParams();
  const [loading, setLoading] = useState(true);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [myCollection, setMyCollection] = useState<any[]>([]);
  const [friendCollection, setFriendCollection] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'common' | 'unique'>('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [friendId]);

  const toggleWatched = async (item: any, isUndo = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCurrentlyWatched = myCollection.some(i => i.content_id === item.content_id);

    if (isUndo || isCurrentlyWatched) {
      const { error } = await supabase
        .from('watched_content')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', item.content_id);

      if (!error) {
        setMyCollection(prev => prev.filter(i => i.content_id !== item.content_id));
        if (isUndo) {
          showSuccess("Action undone");
        } else {
          showSuccess("Removed from collection");
        }
      } else {
        showError("Failed to update collection");
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
          media_type: item.media_type,
          season_count: item.season_count
        });

      if (!error) {
        setMyCollection(prev => [...prev, item]);
        
        toast.success(`Added ${item.title}`, {
          description: "Moved to common interests",
          action: {
            label: 'Undo',
            onClick: () => toggleWatched(item, true)
          },
        });
      } else {
        showError("Failed to add to collection");
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  const myIds = new Set(myCollection.map(i => i.content_id));
  const commonItems = friendCollection.filter(i => myIds.has(i.content_id));
  const uniqueToFriend = friendCollection.filter(i => !myIds.has(i.content_id));

  const displayedItems = (filter === 'common' ? commonItems : filter === 'unique' ? uniqueToFriend : friendCollection).slice(0, visibleCount);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-7xl mx-auto w-full">
        <header className="mb-8">
          <Link to="/friends" className="inline-flex lg:hidden items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft size={15} /> Back to Friends
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                <Sparkles size={14} /> Shared Taste Analysis
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Comparing with <span className="text-primary">{friendProfile?.username || 'Friend'}</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Discover common favorites, unique titles, and taste compatibility.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/10 w-full sm:w-auto justify-center">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'common', label: 'Common' },
                  { id: 'unique', label: 'Unique' }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => { setFilter(btn.id as any); setVisibleCount(12); }}
                    className={cn(
                      "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      filter === btn.id ? "bg-primary text-black shadow-md" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Comparison Overview Metrics (Including Friend's Total Watched) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-card p-5 border-white/10 rounded-2xl text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Friend's Watched</p>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{friendCollection.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total in {friendProfile?.username || 'their'} vault</p>
          </div>
          
          <div className="glass-card p-5 border-primary/30 rounded-2xl cinematic-glow text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Common Interests</p>
            <p className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{commonItems.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Titles you both watched</p>
          </div>

          <div className="glass-card p-5 border-white/10 rounded-2xl text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Friend's Unique</p>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{uniqueToFriend.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Recommendations for you</p>
          </div>

          <div className="glass-card p-5 border-white/10 rounded-2xl text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Compatibility</p>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              {friendCollection.length > 0 
                ? Math.round((commonItems.length / friendCollection.length) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Taste alignment score</p>
          </div>
        </div>

        {displayedItems.length === 0 ? (
          <div className="text-center py-24 opacity-50 space-y-2">
            <Users size={56} className="mx-auto mb-2 text-primary/30" />
            <h2 className="text-xl font-bold text-white">No titles found for this filter</h2>
            <p className="text-xs text-muted-foreground">Try switching to the 'All' tab to see their full list.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[18px] md:gap-6">
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
                      overview: "",
                      season_count: item.season_count
                    }}
                    isWatched={myIds.has(item.content_id)}
                    onToggleWatched={() => toggleWatched(item)}
                    showCategory={true}
                  />
                </div>
              ))}
            </div>

            {visibleCount < (filter === 'common' ? commonItems : filter === 'unique' ? uniqueToFriend : friendCollection).length && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl transition-all font-bold text-xs uppercase tracking-wider text-white border border-white/10"
                >
                  <Plus size={16} />
                  Load More Titles
                </button>
              </div>
            )}
          </>
        )}

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-24 right-6 p-4 bg-primary text-black rounded-full shadow-2xl z-50 hover:scale-110 transition-transform"
            >
              <ChevronUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Compare;