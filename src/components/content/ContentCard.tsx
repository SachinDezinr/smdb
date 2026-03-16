"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, Check, Plus, BookmarkCheck, Calendar, Loader2 } from 'lucide-react';
import { ContentItem, fetchCredits } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  isInWatchlist?: boolean;
  showWatchlistButton?: boolean;
  showWatchedButton?: boolean;
  onToggleWatched?: () => void;
  onToggleWatchlist?: () => void;
  variant?: 'default' | 'compare' | 'upcoming' | 'watchlist';
  isSimilar?: boolean;
}

export const ContentCard = ({ 
  item, 
  isWatched, 
  isInWatchlist,
  showWatchlistButton = true,
  showWatchedButton = true,
  onToggleWatched, 
  onToggleWatchlist,
  variant = 'default',
  isSimilar
}: ContentCardProps) => {
  const isMobile = useIsMobile();
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [credits, setCredits] = useState<{ director?: string, cast?: string[] } | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const isUpcoming = item.status === "Upcoming" || (item.release_date && new Date(item.release_date) > new Date());
  
  // Only show credits for upcoming content
  const shouldShowCredits = isUpcoming;

  useEffect(() => {
    if (shouldShowCredits && !credits && !loadingCredits) {
      const loadCredits = async () => {
        setLoadingCredits(true);
        try {
          const data = await fetchCredits(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
          setCredits(data);
        } catch (err) {
          console.error("Failed to fetch credits", err);
        } finally {
          setLoadingCredits(false);
        }
      };
      loadCredits();
    }
  }, [shouldShowCredits, item.id, item.media_type]);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMobile) {
      e.preventDefault();
      setShowMobileControls(!showMobileControls);
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'movie': return 'Movie';
      case 'tv': return 'Series';
      case 'anime': return 'Anime';
      case 'k-drama': return 'K-Drama';
      default: return 'Content';
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'movie': return 'bg-blue-500/80';
      case 'tv': return 'bg-purple-500/80';
      case 'anime': return 'bg-orange-500/80';
      case 'k-drama': return 'bg-pink-500/80';
      default: return 'bg-primary/80';
    }
  };

  const hasBorder = (variant === 'default' && isWatched) || 
                    (variant === 'upcoming' && isInWatchlist) ||
                    (variant === 'compare' && (isWatched || isSimilar));

  // Logic: Only show watched button if content is released
  const canShowWatched = showWatchedButton && !isUpcoming;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col gap-3"
    >
      <div 
        onClick={handleInteraction}
        className={cn(
          "relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 shadow-xl transition-all duration-500 cursor-pointer",
          !isMobile && "group-hover:shadow-primary/10 group-hover:-translate-y-2",
          hasBorder ? "border-2 border-primary cinematic-glow" : "border border-white/5"
        )}
      >
        <img
          src={item.poster_path}
          alt={item.title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700",
            !isMobile && "group-hover:scale-110"
          )}
          loading="lazy"
        />
        
        {/* Category Pill */}
        <div className={cn(
          "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black text-white backdrop-blur-md z-10 shadow-lg min-w-[55px] flex items-center justify-center uppercase tracking-tighter",
          getCategoryColor(item.media_type)
        )}>
          {getCategoryLabel(item.media_type)}
        </div>

        {/* Rating Pill */}
        {item.vote_average > 0 && (
          <div className={cn(
            "absolute flex items-center justify-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 min-w-[55px] z-10",
            variant === 'compare' ? "top-7 left-2" : "top-2 right-2"
          )}>
            <Star size={10} className="text-primary" fill="currentColor" />
            <span className="text-[9px] font-black text-white">{item.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Controls Overlay */}
        <AnimatePresence>
          {(isMobile ? showMobileControls : true) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={cn(
                "absolute inset-0 flex flex-col justify-end p-4 z-20 rounded-2xl",
                !isMobile && "opacity-0 group-hover:opacity-100 transition-all duration-300",
                isMobile && "bg-black/70 backdrop-blur-sm"
              )}
            >
              {shouldShowCredits && (
                <div className="mb-4 text-center space-y-1">
                  {loadingCredits ? (
                    <Loader2 className="animate-spin text-primary mx-auto" size={16} />
                  ) : credits ? (
                    <>
                      {credits.director && (
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest line-clamp-1">Dir: {credits.director}</p>
                      )}
                      {credits.cast && (
                        <p className="text-[10px] font-medium text-white/80 line-clamp-2 leading-tight">{credits.cast.join(', ')}</p>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {canShowWatched && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleWatched?.(); }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-tight",
                      isWatched 
                        ? "bg-green-500 text-white" 
                        : "bg-white text-black hover:bg-primary"
                    )}
                  >
                    {isWatched ? <Check size={14} /> : <Play size={14} fill="currentColor" />}
                    {isWatched ? "Watched" : "Mark Watched"}
                  </button>
                )}
                
                {showWatchlistButton && !isWatched && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(); }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all border backdrop-blur-md uppercase tracking-tight",
                      isInWatchlist 
                        ? "bg-primary/20 border-primary text-primary" 
                        : "bg-black/40 border-white/20 text-white hover:bg-white/10"
                    )}
                  >
                    {isInWatchlist ? <BookmarkCheck size={14} /> : <Plus size={14} />}
                    {isInWatchlist ? "Watchlist" : "Add Watchlist"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Section */}
      <div className="space-y-1 px-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-sm line-clamp-1 flex-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <span className="text-base font-black text-primary whitespace-nowrap">
            {item.release_date ? item.release_date.split('-')[0] : 'TBA'}
          </span>
        </div>
        
        {isUpcoming && item.release_date && (
          <div className="flex items-center gap-1 text-primary font-bold text-[11px]">
            <Calendar size={10} />
            <span>{item.release_date}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};