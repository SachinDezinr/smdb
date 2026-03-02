"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentItem } from '@/lib/tmdb';

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  onToggleWatched?: (id: number) => void;
  showReleaseDate?: boolean;
}

export const ContentCard = ({ item, isWatched, onToggleWatched, showReleaseDate }: ContentCardProps) => {
  const formatDate = (dateStr: string) => {
    if (dateStr === "TBA") return "TBA";
    try {
      const date = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return "TBA";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col gap-3"
    >
      <div className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-2xl border-2 transition-all duration-500",
        isWatched ? "border-primary cinematic-glow" : "border-transparent group-hover:border-white/20"
      )}>
        <img
          src={item.poster_path}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay for actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {!showReleaseDate && (
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
          )}
        </div>

        {isWatched && (
          <div className="absolute top-3 right-3 bg-primary text-black p-1.5 rounded-full shadow-lg">
            <CheckCircle2 size={16} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-serif text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        {showReleaseDate ? (
          <p className="text-sm font-medium">
            <span className="text-primary">Release:</span> {formatDate(item.release_date)}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary font-bold">IMDb:</span>
            <span className="text-white/90">{item.vote_average > 0 ? item.vote_average.toFixed(1) : "N/A"}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};