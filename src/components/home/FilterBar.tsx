"use client";

import React from 'react';
import { MediaType, Region } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';

interface FilterBarProps {
  activeType: MediaType;
  onTypeChange: (type: MediaType) => void;
  activeRegion: Region;
  onRegionChange: (region: Region) => void;
}

const REGIONS: { label: string; value: Region }[] = [
  { label: 'All', value: 'all' },
  { label: 'Hollywood', value: 'hollywood' },
  { label: 'Bollywood', value: 'bollywood' },
  { label: 'South Indian', value: 'south-indian' },
  { label: 'Korean', value: 'korean' },
];

export const FilterBar = ({ activeType, onTypeChange, activeRegion, onRegionChange }: FilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
        {(['movie', 'tv', 'anime', 'k-drama'] as MediaType[]).map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all",
              activeType === type ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
            )}
          >
            {type === 'tv' ? 'Series' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto no-scrollbar">
        <div className="px-2 text-primary">
          <Filter size={14} />
        </div>
        {REGIONS.map((reg) => (
          <button
            key={reg.value}
            onClick={() => onRegionChange(reg.value)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              activeRegion === reg.value ? "text-primary" : "text-muted-foreground hover:text-white"
            )}
          >
            {reg.label}
          </button>
        ))}
      </div>
    </div>
  );
};