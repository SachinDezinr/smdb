"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ContentItem, fetchTrailers } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

interface TrendingHeroProps {
  items: ContentItem[];
}

export const TrendingHero = ({ items }: TrendingHeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      paginate(1);
    }, 8000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length]);

  const paginate = (newDirection: number) => {
    if (items.length === 0) return;
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = items.length - 1;
      if (nextIndex >= items.length) nextIndex = 0;
      return nextIndex;
    });
    resetTimer();
  };

  const handleWatchTrailer = async (item: ContentItem) => {
    const url = await fetchTrailers(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
    setTrailerUrl(url);
  };

  if (items.length === 0) return (
    <div className="w-full aspect-[1/1] md:aspect-[16/9] lg:aspect-[21/9] bg-neutral-900 animate-pulse rounded-3xl" />
  );

  const current = items[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="relative w-full aspect-[1/1] md:aspect-[16/9] lg:aspect-[21/9] rounded-[2rem] overflow-hidden mb-12 group touch-pan-y">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 }
          }}
          className="absolute inset-0"
        >
          <img 
            src={current.backdrop_path || current.poster_path} 
            alt={current.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="hidden lg:flex absolute inset-y-0 left-0 right-0 items-center justify-between px-6 z-20 pointer-events-none">
        <button 
          onClick={() => paginate(-1)}
          className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-primary hover:text-black transition-all pointer-events-auto opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => paginate(1)}
          className="p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-primary hover:text-black transition-all pointer-events-auto opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="absolute inset-0 p-6 md:p-10 lg:p-12 flex flex-col justify-end max-w-3xl z-10 pointer-events-none">
        <motion.div
          key={`info-${current.id}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Trending</span>
            <div className="flex items-center gap-1 text-primary">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-bold">{current.vote_average.toFixed(1)}</span>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
            {current.title}
          </h2>
          
          <p className="text-muted-foreground text-sm lg:text-base line-clamp-2 max-w-lg">
            {current.overview}
          </p>

          <div className="flex items-center gap-4 pt-2 pointer-events-auto">
            <button 
              onClick={() => handleWatchTrailer(current)}
              className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              <Play size={16} fill="currentColor" />
              Watch Trailer
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 right-12 flex gap-2 z-20">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
              resetTimer();
            }}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              currentIndex === i ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>

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
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};