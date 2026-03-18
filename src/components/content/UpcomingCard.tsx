"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { ContentItem, fetchCredits } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

interface UpcomingCardProps {
  item: ContentItem;
}

export const UpcomingCard: React.FC<UpcomingCardProps> = ({ item }) => {
  const [credits, setCredits] = useState<{ cast: { id: number; name: string }[] } | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate && releaseDate !== "TBA" ? releaseDate.split('-')[0] : 'TBA';

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBA") return "TBA";
    try {
      const date = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    } catch {
      return "TBA";
    }
  };

  useEffect(() => {
    const loadCredits = async () => {
      setLoadingCredits(true);
      try {
        const data = await fetchCredits(item.id, item.media_type === 'movie' ? 'movie' : 'tv');
        setCredits({ cast: data.cast || [] });
      } catch (err) {
        console.error("Failed to fetch credits", err);
      } finally {
        setLoadingCredits(false);
      }
    };
    loadCredits();
  }, [item.id, item.media_type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col gap-3 w-full"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500 bg-neutral-800">
        <img
          src={item.poster_path}
          alt={item.title || item.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Year Pill - Top Right */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-primary px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 z-10">
          {year}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-sm md:text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors flex-1">
            {item.title || item.name}
          </h3>
          {/* Release Date - Right Side */}
          <div className="flex items-center gap-1 text-primary shrink-0">
            <Calendar size={12} />
            <span className="text-[10px] font-bold">{formatDate(releaseDate || "")}</span>
          </div>
        </div>
        
        {/* Credits - Centered and Stacked */}
        <div className="flex flex-col items-center gap-1 min-h-[40px] justify-center">
          {loadingCredits ? (
            <Loader2 className="animate-spin text-primary/20" size={14} />
          ) : (
            <div className="flex flex-wrap justify-center gap-1">
              {credits?.cast?.slice(0, 3).map((person) => (
                <span 
                  key={person.id} 
                  className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-muted-foreground border border-white/5"
                >
                  {person.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};