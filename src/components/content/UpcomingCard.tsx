"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Star, User } from 'lucide-react';
import { ContentItem } from '@/lib/tmdb';

interface UpcomingCardProps {
  item: ContentItem;
}

export const UpcomingCard: React.FC<UpcomingCardProps> = ({ item }) => {
  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate ? new Array(releaseDate.split('-')[0])[0] : 'TBA';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300"
    >
      {/* Poster Section */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
          alt={item.title || item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Year Pill Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-primary/90 backdrop-blur-md text-black text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
            {year}
          </div>
        </div>

        {/* Rating - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold">{item.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-sm line-clamp-1 flex-1 group-hover:text-primary transition-colors">
            {item.title || item.name}
          </h3>
          {/* Release Date - Right Side */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-md">
            <Calendar size={10} />
            {releaseDate || 'TBA'}
          </div>
        </div>

        {/* Credits - Centered and Stacked */}
        <div className="pt-2 border-t border-white/5 flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User size={12} className="text-primary" />
            <span className="font-medium uppercase tracking-wider text-[10px]">Cast & Crew</span>
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {item.credits?.cast?.slice(0, 3).map((person, i) => (
              <span key={person.id} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-muted-foreground">
                {person.name}{i < 2 && ","}
              </span>
            )) || <span className="text-[10px] text-muted-foreground/40 italic">No credits available</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};