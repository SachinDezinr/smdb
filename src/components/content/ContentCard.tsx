"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Film, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentItem, fetchCredits } from '@/lib/tmdb';

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  onToggleWatched?: (id: number) => void;
  showReleaseDate?: boolean;
}

export const ContentCard = ({ item, isWatched, onToggleWatched, showReleaseDate }: ContentCardProps) => {
  const [showCredits, setShowCredits] = useState(false);
  const [credits, setCredits] = useState<{ director: string; cast: string[] } | null>(null);
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

  const handlePosterClick = async () => {
    if (!showReleaseDate) return; // Only for upcoming
    
    if (showCredits) {
      setShowCredits(false);
      return;
    }

    setLoadingCredits(true);
    const data = await fetchCredits(item.id, item.media_type);
    setCredits(data);
    setLoadingCredits(false);
    setShowCredits(true);
  };

  const hasPoster = item.poster_path && !item.poster_path.includes('placeholder.svg');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col gap-3"
    >
      <div 
        onClick={handlePosterClick}
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-2xl border-2 transition-all duration-500 bg-neutral-900 cursor-pointer",
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
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary/10 relative">
            <Film className="text-primary/20 mb-4" size={48} strokeWidth={1} />
            <span className="text-sm font-serif font-bold text-white/80 line-clamp-4 relative z-10">
              {item.title}
            </span>
          </div>
        )}

        <AnimatePresence>
          {showCredits && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/40"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Director</p>
                  <p className="text-sm font-bold text-white">{credits?.director}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Main Cast</p>
                  <div className="flex flex-col gap-1">
                    {credits?.cast.map((name, i) => (
                      <p key={i} className="text-xs text-white/90">{name}</p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Overlay for actions - Hidden for upcoming content */}
        {!showReleaseDate && !showCredits && (
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
        <h3 className="font-serif text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between text-sm">
          {showReleaseDate ? (
            <p className="font-medium">
              <span className="text-primary">Release:</span> {formatDate(item.release_date)}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">IMDb:</span>
              <span className="text-white/90">{item.vote_average > 0 ? item.vote_average.toFixed(1) : "N/A"}</span>
            </div>
          )}
          {item.release_date && !showReleaseDate && (
            <span className="text-muted-foreground text-xs">
              {new Date(item.release_date).getFullYear() || ""}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};