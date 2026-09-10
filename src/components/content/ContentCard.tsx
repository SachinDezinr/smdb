"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Film, User, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentItem, fetchCredits, fetchTvSeasons, getCachedTvSeason, getSeasonDisplayText, isSeriesMediaType } from '@/lib/tmdb';

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  onToggleWatched?: (id: number) => void;
  showReleaseDate?: boolean;
  showCategory?: boolean;
}

export const ContentCard = ({ item, isWatched, onToggleWatched, showReleaseDate, showCategory }: ContentCardProps) => {
  const [showCredits, setShowCredits] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
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

  const handlePosterClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // For upcoming/future items, toggle credits info
    if (showReleaseDate || isFuture) {
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
      return;
    }

    if (!onToggleWatched) return;

    // Calculate vertical click position within poster (0 = top, 1 = bottom)
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = (e.clientY - rect.top) / rect.height;

    // Center zone is roughly between 28% and 72% height
    const isCenterClick = clickY >= 0.28 && clickY <= 0.72;

    if (isCenterClick) {
      // Direct center click triggers the toggle action immediately
      onToggleWatched(item.id);
    } else {
      // Top or bottom click toggles visibility of the action button overlay
      setShowOverlay(prev => !prev);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWatched) {
      onToggleWatched(item.id);
    }
  };

  const hasPoster = item.poster_path && item.poster_path !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col gap-2.5 w-full"
    >
      <div 
        onClick={handlePosterClick}
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-2xl transition-all duration-300 bg-neutral-900 cursor-pointer shadow-lg select-none",
          isWatched 
            ? "border-[2px] border-primary ring-2 ring-primary/50 cinematic-glow" 
            : "border border-white/10 group-hover:border-white/25"
        )}
      >
        {hasPoster ? (
          <img
            src={item.poster_path}
            alt={item.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 pointer-events-none",
              showCredits || showOverlay ? "blur-sm scale-105 opacity-60" : "group-hover:scale-105",
              isWatched && "brightness-[0.92]"
            )}
            loading="lazy"
          />
        ) : (
          <div className={cn(
            "w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary/10 relative",
            (showCredits || showOverlay) && "blur-md opacity-30"
          )}>
            <Film className="text-primary/30 mb-3" size={40} strokeWidth={1.5} />
            <span className="text-xs font-semibold text-white/90 line-clamp-3 leading-snug tracking-tight">
              {item.title}
            </span>
          </div>
        )}

        {/* Category Pill */}
        {showCategory && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="bg-black/75 backdrop-blur-md text-primary text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-lg border border-primary/20 uppercase shadow-md">
              {getCategoryLabel(item.media_type)}
            </span>
          </div>
        )}

        {/* Watched Badge on Top-Right */}
        {isWatched && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2.5 right-2.5 bg-primary text-black p-1.5 rounded-full shadow-lg z-20 font-bold"
          >
            <CheckCircle2 size={16} />
          </motion.div>
        )}

        {/* Action Button Overlay: Appears on top/bottom click or on desktop hover */}
        {!showReleaseDate && !isFuture && onToggleWatched && (
          <div 
            className={cn(
              "absolute inset-0 z-30 flex items-center justify-center p-3 transition-opacity duration-200 pointer-events-none",
              showOverlay ? "opacity-100 bg-black/40 backdrop-blur-xs pointer-events-auto" : "opacity-0 lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto"
            )}
          >
            <button
              type="button"
              onClick={handleActionClick}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95",
                isWatched 
                  ? "bg-primary text-black border border-primary hover:bg-primary/90" 
                  : "bg-black/85 text-primary border border-primary/40 hover:bg-primary hover:text-black hover:border-primary backdrop-blur-md"
              )}
            >
              {isWatched ? (
                <>
                  <Check size={14} />
                  <span>Watched</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Add to Collection</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Credits Overlay for Upcoming Titles */}
        <AnimatePresence>
          {showCredits && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 p-4 flex flex-col justify-center gap-3.5 z-30 bg-black/80 backdrop-blur-md"
            >
              {loadingCredits ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
                      <User size={11} /> Director
                    </p>
                    <p className="text-xs font-semibold text-white truncate drop-shadow-md">{credits?.director || "Unknown"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1">
                      <Users size={11} /> Main Cast
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {credits?.cast?.map((name, i) => (
                        <span key={i} className="text-[10px] bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-md text-white/90 font-medium truncate max-w-full border border-white/10">
                          {name}
                        </span>
                      )) || <span className="text-[11px] text-white/60">N/A</span>}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="font-semibold text-sm md:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors tracking-tight text-white/95">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {showReleaseDate || isFuture ? (
            <p className="font-medium truncate text-[11px]">
              <span className="text-primary/90 font-semibold uppercase tracking-wider text-[10px]">Release:</span> {formatDate(item.release_date)}
            </p>
          ) : (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-primary font-bold text-xs">★</span>
              <span className="text-white/90 text-xs font-semibold">{item.vote_average > 0 ? item.vote_average.toFixed(1) : "N/A"}</span>
            </div>
          )}
          {item.release_date && !showReleaseDate && !isFuture && (
            <span className="text-muted-foreground text-[11px] font-medium">
              {new Date(item.release_date).getFullYear() || ""}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};