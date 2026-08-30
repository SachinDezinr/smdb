"use client";

import React from 'react';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentItem } from '@/lib/tmdb';
import { Loader2 } from 'lucide-react';

interface CatalogSearchResultsProps {
  searchQuery: string;
  searchResults: ContentItem[];
  isLoading: boolean;
  watchedIds: number[];
  onToggleWatched: (item: ContentItem) => void;
  onClearSearch: () => void;
}

export const CatalogSearchResults = ({
  searchQuery,
  searchResults,
  isLoading,
  watchedIds,
  onToggleWatched,
  onClearSearch,
}: CatalogSearchResultsProps) => {
  return (
    <div className="glass-card p-5 md:p-7 border-primary/20 rounded-2xl md:rounded-3xl">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Query</span>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Results for "{searchQuery}"
          </h2>
        </div>
        <button
          onClick={onClearSearch}
          className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
        >
          Clear Search
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-16 opacity-50 space-y-2">
          <p className="text-lg font-semibold">No results found</p>
          <p className="text-xs text-muted-foreground">Try a different spelling or search keyword</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {searchResults.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              isWatched={watchedIds.includes(item.id)}
              onToggleWatched={() => onToggleWatched(item)}
              showCategory={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};