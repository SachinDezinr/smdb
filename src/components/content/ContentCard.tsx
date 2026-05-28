"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Film, User, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentItem, fetchCredits } from '@/lib/tmdb';

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  onToggleWatched?: (id: number) => void;
  showReleaseDate?: boolean;
  showCategory?: boolean;
}

export const ContentCard = ({ item, isWatched, onToggleWatched, showReleaseDate, showCategory }: ContentCardProps) => {
  const [showCredits, setShowCredits] = useState(false);
  const [credits, setCredits] = useState<{ director?: string; cast?: string[] } | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBA") return "TBA";
    try {
      const date = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return "TBA";
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'movie': return 'Movie';
      case 'tv': return 'Series';
      case 'anime': return 'Anime';
      case 'k-drama': return 'K-Drama';
      default: return type;
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isFuture = item.release_date && item.release_date !== "TBA" && item.release_date > today;

  const handlePosterClick = async () => {
    if (!showReleaseDate && !isFuture) return;
    
    if (showCredits) {
      setShowCredits(false);
      return;
    }

    if (!credits) {
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
    setShowCredits(true);
  };

  const hasPoster = item.poster_path && item.poster_path !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col gap-3 w-full"
    >
      <div 
        onClick={handlePosterClick}
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-2xl border-2 transition-all duration-500 bg-neutral-800 cursor-pointer",
          isWatched ? "border-primary cinematic-glow" : "border-transparent group-hover:border-white/20"
        )}
      >
        {hasPoster ? (
          <img
            src={item.poster_path}
            alt={item.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-700",
              showCredits ? "blur-xl scale-110 opacity-40" : "group-hover:scale-110"
            )}
            loading="lazy"
          />
        ) : (
          <div className={cn(
            "w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary/10 relative",
            showCredits && "blur-md opacity-40"
          )}>
            <Film className="text-primary/20 mb-4" size={48} strokeWidth={1} />
            <span className="text-sm font-serif font-bold text-white/80 line-clamp-4 relative z-10">
              {item.title}
            </span>
          </div>
        )}

        {/* Category Pill */}
        {showCategory && (
          <div className="absolute top-3 left-3 z-20">
            <span className="bg-black/60 backdrop-blur-md text-primary text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 uppercase tracking-wider">
              {getCategoryLabel(item.media_type)}
            </span>
          </div>
        )}

        {/* Credits Overlay */}
        <AnimatePresence>
          {showCredits && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 p-4 flex flex-col justify-center gap-4 z-20 bg-black/50 backdrop-blur-md"
            >
              {loadingCredits ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1">
                      <User size={10} /> Director
                    </p>
                    <p className="text-sm font-bold text-white truncate drop-shadow-md">{credits?.director || "Unknown"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1">
                      <Users size={10} /> Main Cast
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {credits?.cast?.map((name, i) => (
                        <span key={i} className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-white font-medium truncate max-w-full border border-white/10">
                          {name}
                        </span>
                      )) || <span className="text-xs text-white/60">N/A</span>}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Watch Action Overlay */}
        {!showReleaseDate && !showCredits && !isFuture && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatched?.(item.id);
              }}
              className={cn(
                "px-4 py-2 rounded-full font-bold text-sm transition-all transform translate-y-4 group-hover:translate-y-0",
                isWatched 
                  ? "bg-primary text-black" 
                  : "bg-white text-black hover:bg-primary"
              )}
            >
              {isWatched ? "Watched" : "Add to Watched"}
            </button>
          </div>
        )}

        {isWatched && (
          <div className="absolute top-3 right-3 bg-primary text-black p-1.5 rounded-full shadow-lg z-10">
            <CheckCircle2 size={16} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-serif text-base md:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs md:text-sm">
          {showReleaseDate || isFuture ? (
            <p className="font-medium truncate">
              <span className="text-primary font-medium">Release:</span> {formatDate(item.release_date)}
            </p>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-primary font-bold">Rating:</span>
              <span className="text-white/90">{item.vote_average > 0 ? item.vote_average.toFixed(1) : "N/A"}</span>
            </div>
          )}
          {item.release_date && !showReleaseDate && !isFuture && (
            <span className="text-muted-foreground text-[12px] md:text-xs">
              {new Date(item.release_date).getFullYear() || ""}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};