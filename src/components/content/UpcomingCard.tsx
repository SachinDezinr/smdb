"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, User, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentItem, fetchCredits } from '@/lib/tmdb';

interface UpcomingCardProps {
  item: ContentItem;
}

export const UpcomingCard: React.FC<UpcomingCardProps> = ({ item }) => {
  const [showCredits, setShowCredits] = useState(false);
  const [credits, setCredits] = useState<{ director?: string; cast?: { id: number; name: string }[] } | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const releaseDate = item.release_date;
  const year = releaseDate && releaseDate !== "TBA" ? releaseDate.split('-')[0] : 'TBA';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col gap-3 w-full"
    >
      <div 
        onClick={handlePosterClick}
        className="relative aspect-[2/3] overflow-hidden rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500 bg-neutral-800 cursor-pointer"
      >
        <img
          src={item.poster_path}
          alt={item.title}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            showCredits ? "blur-xl scale-110 opacity-40" : "group-hover:scale-110"
          )}
          loading="lazy"
        />

        {/* Year Pill - Top Right */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-primary px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 z-10">
          {year}
        </div>

        {/* Credits Overlay */}
        <AnimatePresence>
          {showCredits && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center gap-4 z-20 bg-black/50 backdrop-blur-md"
            >
              {loadingCredits ? (
                <Loader2 className="animate-spin text-primary" />
              ) : (
                <div className="space-y-4 w-full">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-1">
                      <User size={10} /> Director
                    </p>
                    <p className="text-sm font-bold text-white truncate drop-shadow-md">{credits?.director || "Unknown"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-1">
                      <Users size={10} /> Main Cast
                    </p>
                    <div className="flex flex-col items-center gap-1">
                      {credits?.cast?.slice(0, 3).map((person) => (
                        <span key={person.id} className="text-[10px] bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium border border-white/5 w-fit">
                          {person.name}
                        </span>
                      )) || <span className="text-xs text-white/60">N/A</span>}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-serif text-base md:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs md:text-sm">
          <p className="font-medium text-primary">Release:</p>
          <p className="text-white/90 font-medium">{formatDate(item.release_date)}</p>
        </div>
      </div>
    </motion.div>
  );
};