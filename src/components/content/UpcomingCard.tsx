"use client";

import React from 'react';
import { ContentItem } from '@/lib/tmdb';
import { Calendar, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface UpcomingCardProps {
  item: ContentItem;
}

export const UpcomingCard: React.FC<UpcomingCardProps> = ({ item }) => {
  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate ? releaseDate.split('-')[0] : 'TBA';
  const displayTitle = item.title || item.name;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-card rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 shadow-lg"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img 
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
          alt={displayTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        
        {/* Year Pill - Top Right */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
          <span className="text-[10px] font-bold text-white tracking-wider">{year}</span>
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
          <Star className="text-yellow-500 fill-yellow-500" size={12} />
          <span className="text-xs font-bold">{item.vote_average.toFixed(1)}</span>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm line-clamp-1 flex-1 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
          {/* Release Date - Right Side */}
          <div className="flex items-center gap-1.5 text-primary shrink-0">
            <Calendar size={12} />
            <span className="text-[10px] font-medium whitespace-nowrap">
              {releaseDate ? new Date(releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBA'}
            </span>
          </div>
        </div>

        {/* Credits - Centered and Stacked */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex flex-wrap justify-center gap-1.5">
            {item.credits?.cast?.slice(0, 3).map((person) => (
              <span 
                key={person.id} 
                className="text-[9px] bg-secondary/50 hover:bg-primary/20 px-2 py-0.5 rounded-full text-muted-foreground transition-colors text-center"
              >
                {person.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};