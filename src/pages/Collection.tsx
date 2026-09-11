"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';
import { Search, Library, Trash2, Loader2, ChevronUp, Plus, Film, Tv, Sparkles, Heart, BarChart3, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { fetchUserCollection, getCachedCollection, removeCollectionItem } from '@/lib/collectionStore';
import { setCatalogState, getCatalogState } from '@/lib/catalogStore';

const Collection = () => {
  const cached = getCachedCollection();
  const [watchedItems, setWatchedItems] = useState<any[]>(cached || []);
  const [loading, setLoading] = useState(cached === null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  const loadData = async (force = false) => {
    if (!cached || force) {
      if (!cached) setLoading(true);
      const items = await fetchUserCollection(force);
      setWatchedItems(items);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const removeWatched = async (id: number) => {
    if (!confirm("Are you sure you want to remove this from your collection?")) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('watched_content')
      .delete()
      .eq('content_id', id)
      .eq('user_id', user.id);

    if (!error) {
      removeCollectionItem(id);
      setWatchedItems(prev => prev.filter(item => item.content_id !== id));
      
      const currentWatchedIds = getCatalogState().watchedIds;
      setCatalogState({
        watchedIds: currentWatchedIds.filter(wid => wid !== id)
      });
    }
  };

  const stats = {
    total: watchedItems.length,
    movies: watchedItems.filter(i => i.media_type === 'movie').length,
    tv: watchedItems.filter(i => i.media_type === 'tv').length,
    anime: watchedItems.filter(i => i.media_type === 'anime').length,
    kdrama: watchedItems.filter(i => i.media_type === 'k-drama').length,
    currentYear: watchedItems.filter(i => {
      if (!i.release_date || i.release_date === "TBA") return false;
      return new Date(i.release_date).getFullYear() === currentYear;
    }).length,
  };

  const filteredItems = watchedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = false;
    if (activeTab === 'all') {
      matchesTab = true;
    } else if (['movie', 'tv', 'anime', 'k-drama'].includes(activeTab)) {
      matchesTab = item.media_type === activeTab;
    } else if (activeTab === currentYear.toString()) {
      const itemYear = item.release_date && item.release_date !== "TBA" 
        ? new Date(item.release_date).getFullYear().toString() 
        : "";
      matchesTab = itemYear === activeTab;
    }
    
    return matchesSearch && matchesTab;
  });

  const displayedItems = filteredItems.slice(0, visibleCount);

  const statCards = [
    { id: 'all', label: 'All', value: stats.total, icon: Library, color: 'text-white' },
    { id: 'movie', label: 'Movies', value: stats.movies, icon: Film, color: 'text-primary' },
    { id: 'tv', label: 'Series', value: stats.tv, icon: Tv, color: 'text-blue-400' },
    { id: 'anime', label: 'Anime', value: stats.anime, icon: Sparkles, color: 'text-purple-400' },
    { id: 'k-drama', label: 'K-Drama', value: stats.kdrama, icon: Heart, color: 'text-pink-400' },
    { id: currentYear.toString(), label: currentYear.toString(), value: stats.currentYear, icon: Calendar, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-7xl mx-auto w-full">
        <header className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                <CheckCircle2 size={14} /> Personal Vault
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Your <span className="text-primary">Collection</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Manage and filter your tracked watch history.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative group flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search collection..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => navigate('/stats')}
                className="lg:hidden flex items-center justify-center gap-2 px-5 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-black transition-all font-bold text-xs uppercase tracking-wider"
              >
                <BarChart3 size={16} />
                Detailed Stats
              </button>
            </div>
          </div>

          {/* Interactive Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {statCards.map((stat, i) => (
              <motion.button
                key={stat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setActiveTab(stat.id); setVisibleCount(12); }}
                className={cn(
                  "glass-card p-4 rounded-2xl border flex flex-col items-center text-center group transition-all relative overflow-hidden",
                  activeTab === stat.id 
                    ? "border-primary/60 bg-primary/10 cinematic-glow scale-[1.02]" 
                    : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                )}
              >
                {activeTab === stat.id && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                )}
                <stat.icon className={cn("mb-2 transition-transform group-hover:scale-110", stat.color)} size={22} />
                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-50 space-y-2">
            <Library size={56} className="mb-2 text-primary/30" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">No Titles Found</h2>
            <p className="text-muted-foreground text-xs">Try switching category tabs or logging more content.</p>
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
                    isWatched={true}
                  />
                  <button
                    onClick={() => removeWatched(item.content_id)}
                    className="absolute top-2.5 left-2.5 p-2 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md z-30"
                    title="Remove from watched"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {visibleCount < filteredItems.length && (
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

export default Collection;