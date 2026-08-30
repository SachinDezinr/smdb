"use client";

import React from 'react';
import { MediaType, Region } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { LayoutGrid, ChevronDown, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CATEGORIES: { label: string; value: MediaType }[] = [
  { label: 'Movies', value: 'movie' },
  { label: 'Web Series', value: 'tv' },
  { label: 'Anime', value: 'anime' },
  { label: 'K-Drama', value: 'k-drama' },
];

export const REGIONS: { label: string; value: Region }[] = [
  { label: 'All Regions', value: 'all' },
  { label: 'Hollywood', value: 'hollywood' },
  { label: 'Bollywood', value: 'bollywood' },
  { label: 'Pollywood', value: 'punjabi' },
  { label: 'Tollywood', value: 'south-indian' },
  { label: 'Animated', value: 'animated' },
];

interface CatalogFiltersProps {
  activeCategory: MediaType;
  activeRegion: Region;
  onCategoryChange: (category: MediaType) => void;
  onRegionChange: (region: Region) => void;
}

export const CatalogFilters = ({
  activeCategory,
  activeRegion,
  onCategoryChange,
  onRegionChange,
}: CatalogFiltersProps) => {
  const showRegionFilters = activeCategory !== 'anime' && activeCategory !== 'k-drama';

  return (
    <div className="space-y-2.5">
      {/* Desktop Filter Controls */}
      <div className="hidden lg:flex flex-col gap-2 items-center justify-center">
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border",
                activeCategory === cat.value
                  ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {showRegionFilters && (
          <div className="flex flex-wrap gap-1.5 justify-center items-center">
            {REGIONS.map((reg) => (
              <button
                key={reg.value}
                onClick={() => onRegionChange(reg.value)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-semibold text-[11px] tracking-wide transition-all border",
                  activeRegion === reg.value
                    ? "bg-white/15 border-primary/60 text-primary shadow-sm"
                    : "bg-white/[0.02] border-white/5 text-muted-foreground hover:text-white"
                )}
              >
                {reg.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filter Controls */}
      <div className="lg:hidden flex flex-wrap gap-2 justify-center items-center pt-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-black rounded-xl font-bold text-xs uppercase tracking-wider shadow-md">
              <LayoutGrid size={14} />
              {CATEGORIES.find((c) => c.value === activeCategory)?.label}
              <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-neutral-950 border-white/10 text-white">
            {CATEGORIES.map((cat) => (
              <DropdownMenuItem
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className="text-xs font-semibold py-2"
              >
                {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {showRegionFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl font-semibold text-xs tracking-wide">
                <Filter size={13} className="text-primary" />
                {REGIONS.find((r) => r.value === activeRegion)?.label}
                <ChevronDown size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-neutral-950 border-white/10 text-white">
              {REGIONS.map((reg) => (
                <DropdownMenuItem
                  key={reg.value}
                  onClick={() => onRegionChange(reg.value)}
                  className="text-xs font-semibold py-2"
                >
                  {reg.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};