"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentCard } from '@/components/content/ContentCard';
import { fetchContent, ContentItem, MediaType } from '@/lib/tmdb';
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES: { label: string; value: MediaType }[] = [
  { label: 'Movies', value: 'movie' },
  { label: 'Web Series', value: 'tv' },
  { label: 'Anime', value: 'anime' },
  { label: 'K-Drama', value: 'k-drama' },
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<MediaType>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedYears, setExpandedYears] = useState<number[]>([new Date().getFullYear()]);
  const [yearData, setYearData] = useState<Record<number, ContentItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  const loadYearContent = async (year: number) => {
    if (yearData[year]) return;
    
    setLoading(true);
    try {
      const results = await fetchContent(activeCategory, year);
      setYearData(prev => ({ ...prev, [year]: results }));
    } catch (error) {
      console.error("Failed to fetch year content", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year: number) => {
    if (expandedYears.includes(year)) {
      setExpandedYears(prev => prev.filter(y => y !== year));
    } else {
      setExpandedYears(prev => [...prev, year]);
      loadYearContent(year);
    }
  };

  const toggleWatched = (id: number) => {
    setWatchedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setYearData({});
    setExpandedYears([currentYear]);
    loadYearContent(currentYear);
  }, [activeCategory]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold">
              Discover <span className="text-primary">Cinema</span>
            </h1>
            
            <div className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search by title, year, or genre..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all",
                  activeCategory === cat.value 
                    ? "bg-primary text-black" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-4">
          {years.map((year) => (
            <div key={year} className="glass-card overflow-hidden border-white/5">
              <button
                onClick={() => toggleYear(year)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-serif font-bold text-primary">{year}</span>
                  <span className="text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                    {yearData[year]?.length || 0} Items
                  </span>
                </div>
                <ChevronDown 
                  className={cn("transition-transform duration-300", expandedYears.includes(year) && "rotate-180")} 
                  size={24} 
                />
              </button>

              <AnimatePresence>
                {expandedYears.includes(year) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 pt-0">
                      {loading && !yearData[year] ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          {yearData[year]?.map((item) => (
                            <ContentCard 
                              key={item.id} 
                              item={item} 
                              isWatched={watchedIds.includes(item.id)}
                              onToggleWatched={toggleWatched}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;