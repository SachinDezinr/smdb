"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { Search, Library, Trash2, Loader2, ChevronUp, Plus, Film, Tv, Sparkles, Heart, BarChart3, X, PlayCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const Collection = () => {
  const [watchedItems, setWatchedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'anime' | 'k-drama'>('all');
  const [showWrapped, setShowWrapped] = useState(false);
  const currentYear = new Date().getFullYear();

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
    yearTotal: watchedItems.filter(i => i.release_date && new Date(i.release_date).getFullYear() === currentYear).length
  };

  const filteredItems = watchedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || item.media_type === activeTab;
    return matchesSearch && matchesTab;
  });

  const displayedItems = filteredItems.slice(0, visibleCount);

  const statCards = [
    { id: 'all', label: 'All Time', value: stats.total, icon: Library, color: 'text-white' },
    { id: 'movie', label: 'Movies', value: stats.movies, icon: Film, color: 'text-primary' },
    { id: 'tv', label: 'Series', value: stats.tv, icon: Tv, color: 'text-blue-400' },
    { id: 'anime', label: 'Anime', value: stats.anime, icon: Sparkles, color: 'text-purple-400' },
    { id: 'k-drama', label: 'K-Drama', value: stats.kdrama, icon: Heart, color: 'text-pink-400' },
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
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative group flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search collection..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowWrapped(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-black transition-all font-bold"
              >
                <BarChart3 size={18} />
                Detailed Stats
              </button>
            </div>
          </div>

          {/* Interactive Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statCards.map((stat, i) => (
              <motion.button
                key={stat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => { setActiveTab(stat.id as any); setVisibleCount(12); }}
                className={cn(
                  "glass-card p-4 border-white/5 flex flex-col items-center text-center group transition-all relative overflow-hidden",
                  activeTab === stat.id ? "border-primary/50 bg-primary/5 cinematic-glow" : "hover:border-white/20"
                )}
              >
                {activeTab === stat.id && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                )}
                <stat.icon className={cn("mb-2 transition-transform group-hover:scale-110", stat.color)} size={24} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </motion.button>
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

        {/* Wrapped Modal */}
        <AnimatePresence>
          {showWrapped && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-br from-neutral-900 via-neutral-800 to-primary/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-between border border-white/10 shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setShowWrapped(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50"
                >
                  <X size={20} />
                </button>

                <div className="text-center mt-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Film className="text-black" size={32} />
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-primary">SMDB</h3>
                  <p className="text-white/60 text-sm uppercase tracking-widest mt-2">Wrapped {currentYear}</p>
                </div>

                <div className="w-full space-y-8">
                  <div className="text-center">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Titles Released in {currentYear}</p>
                    <p className="text-6xl font-bold text-white">{stats.yearTotal}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <PlayCircle className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.movies}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Movies</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Tv className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.tv}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Series</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Sparkles className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.anime}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Anime</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                      <Heart className="text-primary mb-2" size={20} />
                      <p className="text-2xl font-bold text-white">{stats.kdrama}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">K-Drama</p>
                    </div>
                  </div>
                </div>

                <div className="w-full text-center pb-4">
                  <p className="text-white/40 text-xs italic">"Your cinematic journey, tracked."</p>
                  <p className="text-primary font-bold text-sm mt-2">smdb.app</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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