"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentItem } from '@/lib/tmdb';
import { ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YearSectionProps {
  year: number;
  isExpanded: boolean;
  isHighlighted?: boolean;
  items?: ContentItem[];
  isLoading: boolean;
  watchedIds: number[];
  onToggle: (year: number) => void;
  onLoadMore: (year: number) => void;
  onClose: (year: number) => void;
  onToggleWatched: (item: ContentItem) => void;
}

export const YearSection = ({
  year,
  isExpanded,
  isHighlighted = false,
  items,
  isLoading,
  watchedIds,
  onToggle,
  onLoadMore,
  onClose,
  onToggleWatched,
}: YearSectionProps) => {
  const isLoaded = items !== undefined;

  const getBadgeText = () => {
    if (!isLoaded || (isLoading && (!items || items.length === 0))) {
      return "Loading...";
    }
    return `${items.length}+ Titles`;
  };

  return (
    <div
      id={`year-section-${year}`}
      className={cn(
        "glass-card overflow-hidden rounded-2xl transition-all duration-300 scroll-mt-24",
        isExpanded
          ? "border-primary/50 shadow-md shadow-primary/5"
          : isHighlighted
          ? "border-primary/60 shadow-[0_0_14px_rgba(245,197,24,0.16)] bg-primary/[0.04]"
          : "border-white/10 hover:border-white/20"
      )}
    >
      <button
        onClick={() => onToggle(year)}
        className={cn(
          "w-full flex items-center justify-between p-4 md:p-5 transition-colors",
          isHighlighted && !isExpanded ? "bg-primary/[0.04]" : "hover:bg-white/[0.04]"
        )}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <span
            className={cn(
              "inline-block text-xl md:text-3xl font-bold tracking-tight transition-all select-none",
              isHighlighted || isExpanded ? "text-primary" : ""
            )}
            style={
              !isHighlighted && !isExpanded
                ? {
                    backgroundImage: "linear-gradient(to bottom, #FFFFFF 60%, #F5C518 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }
                : undefined
            }
          >
            {year}
          </span>
          <span className={cn(
            "text-[11px] md:text-xs font-semibold px-2.5 py-0.5 md:px-3 md:py-1 rounded-full border transition-colors",
            isHighlighted && !isExpanded
              ? "bg-primary/15 text-primary border-primary/30 font-medium" 
              : isExpanded
              ? "bg-primary/20 text-primary border-primary/40 font-bold"
              : "text-muted-foreground bg-white/[0.04] border-white/5"
          )}>
            {getBadgeText()}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "transition-transform duration-300",
            isExpanded ? "rotate-180 text-primary" : isHighlighted ? "text-primary" : "text-muted-foreground"
          )}
          size={18}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 md:p-6 pt-0">
              {items && items.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {items.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      isWatched={watchedIds.includes(item.id)}
                      onToggleWatched={() => onToggleWatched(item)}
                    />
                  ))}
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : (
                items && items.length > 0 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => onLoadMore(year)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-all font-bold text-xs uppercase tracking-wider text-white border border-white/10"
                    >
                      <Plus size={15} />
                      Load More {year}
                    </button>
                    <button
                      onClick={() => onClose(year)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] hover:border-red-500/30 hover:text-red-400 rounded-xl transition-all font-bold text-xs uppercase tracking-wider text-muted-foreground border border-white/10"
                      title={`Close ${year}`}
                    >
                      <ChevronUp size={15} />
                      Close {year}
                    </button>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};