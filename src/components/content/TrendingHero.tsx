"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { fetchTrending, fetchTrailers, ContentItem } from '@/lib/tmdb';
import { Play, Info, Volume2, VolumeX, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const TrendingHero = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFetchingTrailer, setIsFetchingTrailer] = useState(false);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const data = await fetchTrending();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      } finally {
        setLoading(false);
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

  const handleWatchTrailer = useCallback(async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    if (trailerUrl && showTrailer) return;

    setIsFetchingTrailer(true);
    try {
      const url = await fetchTrailers(currentItem.id, currentItem.media_type === 'movie' ? 'movie' : 'tv');
      if (url) {
        setTrailerUrl(url);
        setShowTrailer(true);
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
    } finally {
      setIsFetchingTrailer(false);
    }
  }, [items, currentIndex, trailerUrl, showTrailer]);

  // Pre-fetch trailer on hover or touch start for instant feel
  const prefetchTrailer = async () => {
    const currentItem = items[currentIndex];
    if (!currentItem || trailerUrl) return;
    try {
      const url = await fetchTrailers(currentItem.id, currentItem.media_type === 'movie' ? 'movie' : 'tv');
      if (url) setTrailerUrl(url);
    } catch (e) {}
  };

  if (loading || items.length === 0) {
    return (
      <div className="relative h-[60vh] lg:h-[85vh] w-full rounded-3xl overflow-hidden bg-white/5 animate-pulse flex items-center justify-center">
        <Loader2 className="animate-spin text-primary/20" size={48} />
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <section className="relative h-[65vh] lg:h-[85vh] w-full rounded-3xl overflow-hidden mb-12 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
            src={currentItem.backdrop_path}
            alt={currentItem.title}
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[10s]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-16 max-w-3xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary text-black text-xs font-black rounded-full uppercase tracking-tighter">
              Trending Now
            </span>
            <span className="text-sm font-bold text-white/60">
              {new Date(currentItem.release_date).getFullYear()}
            </span>
          </div>

          <h2 className="text-5xl lg:text-7xl font-serif font-bold leading-tight">
            {currentItem.title}
          </h2>

          <p className="text-lg text-white/70 line-clamp-3 max-w-xl font-medium leading-relaxed">
            {currentItem.overview}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={handleWatchTrailer}
              onTouchStart={prefetchTrailer}
              onMouseEnter={prefetchTrailer}
              disabled={isFetchingTrailer}
              className="flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-black rounded-2xl font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
            >
              {isFetchingTrailer ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Play fill="currentColor" size={24} />
              )}
              <span className="uppercase tracking-tight">Watch Trailer</span>
            </button>
            
            <button className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all backdrop-blur-md border border-white/10">
              <Info size={24} />
              <span className="uppercase tracking-tight">More Info</span>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 right-10 flex items-center gap-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-4 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        
        <div className="flex gap-2">
          {items.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                currentIndex === idx ? "w-8 bg-primary" : "w-2 bg-white/20"
              )}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showTrailer && trailerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 lg:p-10"
          >
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[101]"
            >
              <X size={32} />
            </button>
            <div className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <iframe
                src={`${trailerUrl}?autoplay=1&mute=${isMuted ? 1 : 0}`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};