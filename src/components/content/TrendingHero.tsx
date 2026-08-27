"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { ContentItem, fetchTrending, fetchTrailers } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

export const TrendingHero = () => {
  const [trending, setTrending] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      paginate(1);
    }, 8000);
  };

  useEffect(() => {
    const load = async () => {
      const data = await fetchTrending();
      setTrending(data);
      setLoading(false);
    };
    load();
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = trending.length - 1;
      if (nextIndex >= trending.length) nextIndex = 0;
      return nextIndex;
    });
    resetTimer();
  };

  const handleWatchTrailer = async (item: ContentItem) => {
    const url = await fetchTrailers(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
    setTrailerUrl(url);
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  if (loading || trending.length === 0) return (
    <div className="w-full aspect-[16/8] md:aspect-[21/9] lg:aspect-[32/10] bg-neutral-900/60 animate-pulse rounded-2xl md:rounded-3xl border border-white/5 mb-5" />
  );

  const current = trending[currentIndex];

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
    <div className="relative w-full aspect-[16/8] md:aspect-[21/9] lg:aspect-[32/10] rounded-2xl md:rounded-3xl overflow-hidden mb-5 group touch-pan-y border border-white/10 shadow-2xl">
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
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img 
            src={current.backdrop_path || current.poster_path} 
            alt={current.title}
            className="w-full h-full object-cover pointer-events-none"
          />
          {/* Subtle vignette overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.3)_100%)] pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      <div className="hidden lg:flex absolute inset-y-0 left-0 right-0 items-center justify-between px-6 z-20 pointer-events-none">
        <button 
          onClick={() => paginate(-1)}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-primary hover:text-black transition-all pointer-events-auto opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
        >
          <ChevronLeft size={22} />
        </button>
        <button 
          onClick={() => paginate(1)}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-primary hover:text-black transition-all pointer-events-auto opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="absolute inset-0 p-4 md:p-8 lg:p-10 flex flex-col justify-end max-w-3xl z-10 pointer-events-none">
        <motion.div
          key={`info-${current.id}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-1.5 md:space-y-2 lg:space-y-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-primary text-black text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
              <Sparkles size={10} /> Trending
            </span>
            <div className="flex items-center gap-1 text-primary bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/30">
              <Star size={11} fill="currentColor" />
              <span className="text-[11px] md:text-xs font-bold">{current.vote_average.toFixed(1)}</span>
            </div>
          </div>
          
          <h2 className="text-lg md:text-3xl lg:text-5xl font-bold tracking-tight text-white leading-tight drop-shadow-lg truncate max-w-full">
            {current.title}
          </h2>
          
          <p className="hidden sm:line-clamp-2 text-white/80 text-xs md:text-sm max-w-lg drop-shadow-md leading-relaxed">
            {current.overview}
          </p>

          <div className="flex items-center gap-3 pt-0.5 pointer-events-auto">
            <button 
              onClick={() => handleWatchTrailer(current)}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-black px-3.5 py-1.5 md:px-5 md:py-2.5 rounded-xl font-bold text-[11px] md:text-xs hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              <Play size={12} fill="currentColor" />
              Watch Trailer
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-3 md:bottom-4 lg:bottom-6 right-4 md:right-6 lg:right-10 flex gap-1.5 z-20">
        {trending.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
              resetTimer();
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              currentIndex === i ? "w-5 md:w-6 lg:w-8 bg-primary" : "w-1.5 lg:w-2 bg-white/30 hover:bg-white/50"
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
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
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