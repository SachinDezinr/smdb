"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { ContentGrid } from '@/components/home/ContentGrid';
import { TrendingHero } from '@/components/home/TrendingHero';
import { SearchBar } from '@/components/home/SearchBar';
import { FilterBar } from '@/components/home/FilterBar';
import { fetchContent, fetchTrending, ContentItem, MediaType, Region } from '@/lib/tmdb';
import { useInView } from 'react-intersection-observer';
import { Loader2, Sparkles } from 'lucide-react';

const Index = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [trending, setTrending] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [activeType, setActiveType] = useState<MediaType>('movie');
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const { ref, inView } = useInView();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [trendingData, initialContent] = await Promise.all([
        fetchTrending(),
        fetchContent(activeType, undefined, 1, searchQuery, activeRegion)
      ]);
      setTrending(trendingData);
      setContent(initialContent);
      setPage(1);
      setHasMore(initialContent.length > 0);
      setLoading(false);
    };
    loadInitialData();
  }, [activeType, activeRegion, searchQuery]);

  useEffect(() => {
    if (inView && !loadingMore && hasMore) {
      loadMore();
    }
  }, [inView]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const newContent = await fetchContent(activeType, undefined, nextPage, searchQuery, activeRegion);
    
    if (newContent.length === 0) {
      setHasMore(false);
    } else {
      setContent(prev => {
        const combined = [...prev, ...newContent];
        // Ensure everything stays sorted by release date even after loading more
        return combined.sort((a, b) => {
          if (a.release_date === "TBA") return 1;
          if (b.release_date === "TBA") return -1;
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        });
      });
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 pb-24 lg:pb-10">
        <TrendingHero items={trending} />
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-8 relative z-10">
          <div className="glass-card p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border-white/5">
            <SearchBar onSearch={setSearchQuery} />
            <FilterBar 
              activeType={activeType} 
              onTypeChange={setActiveType}
              activeRegion={activeRegion}
              onRegionChange={setActiveRegion}
            />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-primary" size={20} />
            <h2 className="text-xl font-serif font-bold">
              {searchQuery ? `Results for "${searchQuery}"` : `Latest ${activeType === 'movie' ? 'Movies' : activeType === 'tv' ? 'Web Series' : activeType.charAt(0).toUpperCase() + activeType.slice(1)}`}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <>
              <ContentGrid items={content} />
              
              {hasMore && (
                <div ref={ref} className="flex justify-center py-10">
                  {loadingMore && <Loader2 className="animate-spin text-primary" size={30} />}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;