"use client";

import React, { useState, useEffect } from 'react';
import { Play, Info, Loader2, Volume2, VolumeX } from 'lucide-react';
import { fetchTrending, fetchTrailers, ContentItem } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const TrendingHero = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const trending = await fetchTrending();
        setItems(trending);
      } catch (error) {
        console.error("Failed to load trending:", error);
      }
    };
    loadTrending();
  }, []);

  useEffect(() => {
    if (items.length === 0 || showTrailer) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length, showTrailer]);

  const handleWatchTrailer = async (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent any default behavior that might interfere on mobile
    if (e.type === 'touchstart') {
      // We don't preventDefault here to allow the click to bubble if needed, 
      // but we ensure the action starts immediately.
    }
    
    const item = items[currentIndex];
    if (!item || isLoadingTrailer) return;

    setIsLoadingTrailer(true);
    try {
      const url = await fetchTrailers(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
      if (url) {
        setTrailerUrl(url);
        setShowTrailer(true);
      }
    } catch (error) {
      console.error("Failed to fetch trailer:", error);
    } finally {
      setIsLoadingTrailer(false);
    }
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <section className="relative h-[70vh] lg:h-[85vh] w-full overflow-hidden rounded-3xl mb-10 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {showTrailer && trailerUrl ? (
            <div className="absolute inset-0 bg-black">
              <iframe
                src={`${trailerUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailerUrl.split('/').pop()}`}
                className="w-full h-full scale-150 pointer-events-none"
                allow="autoplay; encrypted-media"
              />
              <div className="absolute bottom-10 right-10 z-20 flex gap-4">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all"
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <button 
                  onClick={() => setShowTrailer(false)}
                  className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-primary transition-all"
                >
                  Close Trailer
                </button>
              </div>
            </div>
          ) : (
            <>
              <img
                src={currentItem.backdrop_path}
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 w-full p-8 lg:p-16 z-10">
        <motion.div
          key={`info-${currentItem.id}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl space-y-6"
        >
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary text-black text-xs font-black rounded-full uppercase tracking-wider">
              Trending Now
            </span>
            <span className="text-sm font-bold text-white/60">
              {currentItem.release_date.split('-')[0]}
            </span>
          </div>
          
          <h2 className="text-5xl lg:text-7xl font-serif font-bold leading-tight">
            {currentItem.title}
          </h2>
          
          <p className="text-lg text-white/70 line-clamp-3 font-medium leading-relaxed">
            {currentItem.overview}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={handleWatchTrailer}
              disabled={isLoadingTrailer}
              className="group/btn relative flex items-center gap-3 bg-primary text-black px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all touch-manipulation"
            >
              {isLoadingTrailer ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Play fill="currentColor" size={24} />
              )}
              <span>{isLoadingTrailer ? 'Loading...' : 'Watch Trailer'}</span>
            </button>
            
            <button className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">
              <Info size={24} />
              <span>More Info</span>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 right-8 lg:right-16 flex gap-2 z-10">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>
    </section>
  );
};