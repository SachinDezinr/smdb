"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { Search, Library, Trash2, Loader2, ChevronUp, Plus, Film, Tv, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const Collection = () => {
  const [watchedItems, setWatchedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'anime' | 'k-drama'>('all');

  const fetchWatched = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('watched_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setWatchedItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWatched();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const removeWatched = async (id: number) => {
    if (!confirm("Are you sure you want to remove this from your collection?")) return;

    const { error } = await supabase
      .from('watched_content')
      .delete()
      .eq('content_id', id);

    if (!error) {
      setWatchedItems(prev => prev.filter(item => item.content_id !== id));
    }
  };

  const stats = {
    total: watchedItems.length,
    movies: watchedItems.filter(i => i.media_type === 'movie').length,
    tv: watchedItems.filter(i => i.media_type === 'tv').length,
    anime: watchedItems.filter(i => i.media_type === 'anime').length,
    kdrama: watchedItems.filter(i => i.media_type === 'k-drama').length,
  };

  const filteredItems = watchedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || item.media_type === activeTab;
    return matchesSearch && matchesTab;
  });

  const displayedItems = filteredItems.slice(0, visibleCount);

  const statCards = [
    { label: 'Movies', value: stats.movies, icon: Film, color: 'text-primary' },
    { label: 'Series', value: stats.tv, icon: Tv, color: 'text-blue-400' },
    { label: 'Anime', value: stats.anime, icon: Sparkles, color: 'text-purple-400' },
    { label: 'K-Drama', value: stats.kdrama, icon: Heart, color: 'text-pink-400' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold">
                Your <span className="text-primary">Collection</span>
              </h1>
              <p className="text-muted-foreground mt-2">Manage your personal cinematic library.</p>
            </div>
            
            <div className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search your collection..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-4 border-white/5 flex flex-col items-center text-center group hover:border-primary/30 transition-colors"
              >
                <stat.icon className={cn("mb-2 transition-transform group-hover:scale-110", stat.color)} size={24} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All', count: stats.total },
              { id: 'movie', label: 'Movies', count: stats.movies },
              { id: 'tv', label: 'Series', count: stats.tv },
              { id: 'anime', label: 'Anime', count: stats.anime },
              { id: 'k-drama', label: 'K-Drama', count: stats.kdrama },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-primary border-primary text-black" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
                )}
              >
                {tab.label}
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-lg", activeTab === tab.id ? "bg-black/20" : "bg-white/10")}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
            <Library size={64} className="mb-4" />
            <h2 className="text-2xl font-serif">No items found</h2>
            <p>Try changing your filters or adding more content</p>
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
                    isWatched={true}
                  />
                  <button
                    onClick={() => removeWatched(item.content_id)}
                    className="absolute top-2 left-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
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

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-24 right-6 p-4 bg-primary text-black rounded-full shadow-2xl z-50 hover:scale-110 transition-transform"
            >
              <ChevronUp size={24} />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Collection;