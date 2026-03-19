"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { ContentItem } from '@/lib/tmdb';

interface UpcomingCardProps {
  item: ContentItem;
}

export const UpcomingCard: React.FC<UpcomingCardProps> = ({ item }) => {
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

        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-primary px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 z-10">
          {year}
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-serif text-sm md:text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {item.title || item.name}
        </h3>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {formatDate(releaseDate || "")}
          </span>
        </div>
      </div>
    </motion.div>
  );
};