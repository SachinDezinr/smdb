"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentItem, fetchTrending, fetchTrailers } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

export const TrendingHero = () => {
  const [trending, setTrending] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchTrending();
      setTrending(data);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trending.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [trending]);

  const handleWatchTrailer = async (item: ContentItem) => {
    const url = await fetchTrailers(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
    setTrailerUrl(url);
  };

  if (loading || trending.length === 0) return (
    <div className="w-full aspect-[21/9] bg-neutral-900 animate-pulse rounded-3xl" />
  );

  const current = trending[currentIndex];

  return (
    <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] rounded-[2rem] overflow-hidden mb-12 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img 
            src={current.backdrop_path} 
            alt={current.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 p-6 lg:p-12 flex flex-col justify-end max-w-2xl">
        <motion.div
          key={`info-${current.id}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Trending</span>
            <div className="flex items-center gap-1 text-primary">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-bold">{current.vote_average.toFixed(1)}</span>
            </div>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-serif font-bold leading-tight">
            {current.title}
          </h2>
          
          <p className="text-muted-foreground text-sm lg:text-base line-clamp-2 max-w-lg">
            {current.overview}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={() => handleWatchTrailer(current)}
              className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              <Play size={18} fill="currentColor" />
              Watch Trailer
            </button>
          </div>
        </motion.div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 right-12 flex gap-2">
        {trending.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              currentIndex === i ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {trailerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setTrailerUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`${trailerUrl}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <button 
                onClick={() => setTrailerUrl(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="rotate-45" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};