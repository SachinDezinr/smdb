"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Users, ArrowLeft, Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { showSuccess } from '@/utils/toast';
import { ContentCard } from '@/components/content/ContentCard';

interface CompareItem {
  content_id: number;
  title: string;
  poster_path: string;
  media_type: string;
  release_date?: string;
  vote_average?: number;
}

const Compare = () => {
  const { friendId } = useParams();
  const [loading, setLoading] = useState(true);
  const [friend, setFriend] = useState<any>(null);
  const [similar, setSimilar] = useState<CompareItem[]>([]);
  const [unique, setUnique] = useState<CompareItem[]>([]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !friendId) return;

    const [friendRes, userWatched, friendWatched] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', friendId).single(),
      supabase.from('watched_content').select('*').eq('user_id', user.id),
      supabase.from('watched_content').select('*').eq('user_id', friendId)
    ]);

    setFriend(friendRes.data);
    
    const userItems = userWatched.data || [];
    const friendItems = friendWatched.data || [];

    const similarItems = userItems.filter(u => friendItems.some(f => f.content_id === u.content_id));
    const uniqueItems = friendItems.filter(f => !userItems.some(u => u.content_id === f.content_id));

    setSimilar(similarItems);
    setUnique(uniqueItems);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [friendId]);

  const moveToUnique = async (item: CompareItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('watched_content').delete().eq('user_id', user.id).eq('content_id', item.content_id);
    setSimilar(prev => prev.filter(i => i.content_id !== item.content_id));
    setUnique(prev => [item, ...prev]);
    showSuccess("Moved to unique category");
  };

  const addToWatched = async (item: CompareItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('watched_content').insert({
      user_id: user.id,
      content_id: item.content_id,
      title: item.title,
      poster_path: item.poster_path,
      media_type: item.media_type
    });
    setUnique(prev => prev.filter(i => i.content_id !== item.content_id));
    setSimilar(prev => [item, ...prev]);
    showSuccess("Added to your watched list");
  };

  const addToWatchlist = async (item: CompareItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('watchlist').insert({
      user_id: user.id,
      content_id: item.content_id,
      title: item.title,
      poster_path: item.poster_path,
      media_type: item.media_type
    });
    setUnique(prev => prev.filter(i => i.content_id !== item.content_id));
    showSuccess("Added to watchlist");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-background text-foreground"
    >
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-12">
          <Link to="/friends" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Friends
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
              <Users size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold">Comparing with <span className="text-primary">{friend?.full_name}</span></h1>
            </div>
          </div>
        </header>

        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Check className="text-green-500" size={24} />
              <h2 className="text-2xl font-bold">Similar Taste ({similar.length})</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {similar.map((item) => (
                <ContentCard 
                  key={item.content_id}
                  item={{
                    id: item.content_id,
                    title: item.title,
                    poster_path: item.poster_path,
                    media_type: item.media_type as any,
                    release_date: item.release_date || '',
                    vote_average: item.vote_average || 0,
                    genre_ids: [],
                    overview: ''
                  }}
                  isWatched={true}
                  showWatchlistButton={false}
                  onToggleWatched={() => moveToUnique(item)}
                  variant="compare"
                />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-8">
              <Plus className="text-primary" size={24} />
              <h2 className="text-2xl font-bold">Unique to {friend?.full_name} ({unique.length})</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {unique.map((item) => (
                <ContentCard 
                  key={item.content_id}
                  item={{
                    id: item.content_id,
                    title: item.title,
                    poster_path: item.poster_path,
                    media_type: item.media_type as any,
                    release_date: item.release_date || '',
                    vote_average: item.vote_average || 0,
                    genre_ids: [],
                    overview: ''
                  }}
                  onToggleWatched={() => addToWatched(item)}
                  onToggleWatchlist={() => addToWatchlist(item)}
                  variant="compare"
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </motion.div>
  );
};

export default Compare;