"use client";

import React, { useState, useEffect } from 'react';
import { Star, Play, Calendar, Bookmark, CheckCircle2 } from 'lucide-react';
import { ContentItem } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  onToggleWatched?: () => void;
}

export const ContentCard = ({ item, isWatched: initialIsWatched, onToggleWatched }: ContentCardProps) => {
  const [isWatched, setIsWatched] = useState(initialIsWatched);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const isUpcoming = item.status === "Upcoming";

  useEffect(() => {
    setIsWatched(initialIsWatched);
    checkWatchlist();
  }, [initialIsWatched, item.id]);

  const checkWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('watchlist').select('id').eq('user_id', user.id).eq('content_id', item.id).single();
    setIsInWatchlist(!!data);
  };

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Please sign in first");
      return;
    }

    if (isInWatchlist) {
      const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id).eq('content_id', item.id);
      if (!error) {
        setIsInWatchlist(false);
        showSuccess("Removed from watchlist");
      }
    } else {
      const { error } = await supabase.from('watchlist').insert({
        user_id: user.id,
        content_id: item.id,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        media_type: item.media_type
      });
      if (!error) {
        setIsInWatchlist(true);
        showSuccess("Added to watchlist");
      }
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col gap-3"
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 shadow-xl transition-all duration-500 group-hover:shadow-primary/20 group-hover:-translate-y-2">
        <img 
          src={item.poster_path} 
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex flex-col gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatched?.();
              }}
              className={cn(
                "w-full py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-2",
                isWatched 
                  ? "bg-primary text-black border-primary" 
                  : "bg-white/10 border-white/10 text-white hover:bg-primary hover:text-black hover:border-primary"
              )}
            >
              {isWatched ? <CheckCircle2 size={14} /> : <Play size={14} fill="currentColor" />}
              {isWatched ? 'Watched' : 'Mark as Watched'}
            </button>
            
            {!isWatched && (
              <button 
                onClick={toggleWatchlist}
                className={cn(
                  "w-full py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-2",
                  isInWatchlist 
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400" 
                    : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                )}
              >
                <Bookmark size={14} fill={isInWatchlist ? "currentColor" : "none"} />
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            )}
          </div>
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isUpcoming ? (
            <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 uppercase tracking-tighter">
              <Calendar size={10} />
              Upcoming
            </div>
          ) : item.vote_average > 0 && (
            <div className="bg-black/60 backdrop-blur-md text-primary text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
              <Star size={10} fill="currentColor" />
              {item.vote_average.toFixed(1)}
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <div className="bg-black/60 backdrop-blur-md text-white/70 text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest border border-white/10">
            {item.media_type === 'tv' ? 'Series' : item.media_type}
          </div>
        </div>
      </div>

      <div className="space-y-1 px-1">
        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
          <span>{item.release_date.split('-')[0]}</span>
          {isUpcoming && (
            <span className="text-blue-400 font-bold">Coming Soon</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};