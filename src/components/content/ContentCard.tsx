"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, Check, Plus, BookmarkCheck, Calendar, Loader2 } from 'lucide-react';
import { ContentItem, fetchCredits } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  isInWatchlist?: boolean;
  showWatchlistButton?: boolean;
  showWatchedButton?: boolean;
  onToggleWatched?: () => void;
  onToggleWatchlist?: () => void;
  variant?: 'default' | 'upcoming' | 'watchlist';
}

export const ContentCard = ({ 
  item, 
  isWatched, 
  isInWatchlist,
  showWatchlistButton = true,
  showWatchedButton = true,
  onToggleWatched, 
  onToggleWatchlist,
  variant = 'default'
}: ContentCardProps) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [credits, setCredits] = useState<{ director?: string, cast?: string[] } | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const isUpcoming = item.status === "Upcoming" || new Date(item.release_date) > new Date();

  const handlePosterClick = async () => {
    // On mobile, we show the overlay with buttons/credits
    if (window.innerWidth < 1024) {
      if (showOverlay) {
        setShowOverlay(false);
        return;
      }

      setShowOverlay(true);
      
      // Only fetch credits for upcoming content on mobile
      if (isUpcoming && !credits && !loadingCredits) {
        setLoadingCredits(true);
        try {
          const data = await fetchCredits(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
          setCredits(data);
        } catch (err) {
          console.error("Failed to fetch credits", err);
        } finally {
          setLoadingCredits(false);
        }
      }
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

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBA") return "TBA";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
  };

  // Determine border color based on status and variant
  const getBorderClass = () => {
    if (variant === 'default' && isWatched) return "ring-2 ring-green-500 ring-offset-2 ring-offset-background";
    if (variant === 'upcoming' && isInWatchlist) return "ring-2 ring-primary ring-offset-2 ring-offset-background";
    if (variant === 'watchlist' && isInWatchlist) return "ring-2 ring-primary ring-offset-2 ring-offset-background";
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="group relative flex flex-col gap-3"
    >
      <div 
        onClick={handlePosterClick}
        className={cn(
          "relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 shadow-xl transition-all duration-500 group-hover:shadow-primary/10 group-hover:-translate-y-2 cursor-pointer",
          getBorderClass()
        )}
      >
        <img
          src={item.poster_path}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Mobile/Desktop Overlay */}
        <AnimatePresence>
          {(showOverlay || (window.innerWidth >= 1024 && !isUpcoming)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 bg-black/80 backdrop-blur-md z-20 p-4 flex flex-col justify-center items-center text-center",
                window.innerWidth >= 1024 && "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              )}
            >
              {isUpcoming && loadingCredits ? (
                <Loader2 className="animate-spin text-primary" size={24} />
              ) : (
                <div className="space-y-4 w-full">
                  {isUpcoming && credits && (
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Credits</p>
                      <p className="text-xs text-white line-clamp-2">{credits.director || credits.cast?.slice(0, 2).join(', ')}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2 w-full max-w-[140px] mx-auto">
                    {showWatchedButton && !isUpcoming && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleWatched?.(); }}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                          isWatched ? "bg-green-500 text-white" : "bg-white text-black hover:bg-primary"
                        )}
                      >
                        {isWatched ? <Check size={14} /> : <Play size={14} fill="currentColor" />}
                        {isWatched ? "Watched" : "Mark Watched"}
                      </button>
                    )}
                    
                    {showWatchlistButton && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(); }}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border backdrop-blur-md",
                          isInWatchlist ? "bg-primary/20 border-primary text-primary" : "bg-black/40 border-white/20 text-white hover:bg-white/10"
                        )}
                      >
                        {isInWatchlist ? <BookmarkCheck size={14} /> : <Plus size={14} />}
                        {isInWatchlist ? "In Watchlist" : "Add Watchlist"}
                      </button>
                    )}
                  </div>
                  
                  {window.innerWidth < 1024 && (
                    <p className="text-[10px] text-muted-foreground pt-2">Tap to close</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category & Rating Pills (Same Size) */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div className="h-6 px-2.5 rounded-md text-[10px] font-bold text-white bg-primary/80 backdrop-blur-md flex items-center justify-center shadow-lg">
            {getCategoryLabel(item.media_type)}
          </div>
          {item.vote_average > 0 && (
            <div className="h-6 px-2.5 rounded-md text-[10px] font-bold text-white bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center gap-1">
              <Star size={10} className="text-primary" fill="currentColor" />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors flex-1">
            {item.title}
          </h3>
          <span className="text-xs font-bold text-muted-foreground shrink-0">
            {item.release_date.split('-')[0]}
          </span>
        </div>
        
        {isUpcoming && (
          <div className="flex items-center gap-1 text-primary font-bold text-[11px]">
            <Calendar size={10} />
            <span>{formatDate(item.release_date)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};