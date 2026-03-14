"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, Check, Plus, Bookmark, BookmarkCheck, Calendar, User as UserIcon, Loader2 } from 'lucide-react';
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
}

export const ContentCard = ({ 
  item, 
  isWatched, 
  isInWatchlist,
  showWatchlistButton = true,
  showWatchedButton = true,
  onToggleWatched, 
  onToggleWatchlist 
}: ContentCardProps) => {
  const [showCredits, setShowCredits] = useState(false);
  const [credits, setCredits] = useState<{ director?: string, cast?: string[] } | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const handlePosterClick = async () => {
    if (showCredits) {
      setShowCredits(false);
      return;
    }

    setShowCredits(true);
    if (!credits && !loadingCredits) {
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

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBA") return "TBA";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col gap-3"
    >
      <div 
        onClick={handlePosterClick}
        className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 shadow-xl transition-all duration-500 group-hover:shadow-primary/10 group-hover:-translate-y-2 cursor-pointer"
      >
        <img
          src={item.poster_path}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Credits Overlay */}
        <AnimatePresence>
          {showCredits && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 p-4 flex flex-col justify-center items-center text-center"
            >
              {loadingCredits ? (
                <Loader2 className="animate-spin text-primary" size={24} />
              ) : (
                <div className="space-y-4">
                  {credits?.director && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Directed By</p>
                      <p className="text-sm font-bold text-white">{credits.director}</p>
                    </div>
                  )}
                  {credits?.cast && credits.cast.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Starring</p>
                      <div className="flex flex-wrap justify-center gap-1">
                        {credits.cast.map((name, i) => (
                          <span key={i} className="text-xs text-white/80">
                            {name}{i < credits.cast.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!credits?.director && !credits?.cast && (
                    <p className="text-xs text-muted-foreground">No credit information available</p>
                  )}
                  <p className="text-[10px] text-muted-foreground pt-4">Click to close</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Pill */}
        <div className={cn(
          "absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold text-white backdrop-blur-md z-10 shadow-lg",
          getCategoryColor(item.media_type)
        )}>
          {getCategoryLabel(item.media_type)}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="flex flex-col gap-2">
            {showWatchedButton && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleWatched?.(); }}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                  isWatched 
                    ? "bg-green-500 text-white" 
                    : "bg-white text-black hover:bg-primary hover:text-black"
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
                  "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md",
                  isInWatchlist 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-black/40 border-white/20 text-white hover:bg-white/10"
                )}
              >
                {isInWatchlist ? <BookmarkCheck size={14} /> : <Plus size={14} />}
                {isInWatchlist ? "In Watchlist" : "Add Watchlist"}
              </button>
            )}
          </div>
        </div>

        {item.vote_average > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
            <Star size={12} className="text-primary" fill="currentColor" />
            <span className="text-[10px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="space-y-1 px-1">
        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium pt-1">
          <span>{item.release_date.split('-')[0]}</span>
          {item.status === "Upcoming" && (
            <div className="flex items-center gap-1 text-primary font-bold text-[11px]">
              <Calendar size={10} />
              <span>{formatDate(item.release_date)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};