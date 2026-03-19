"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { TrendingHero } from '@/components/home/TrendingHero';
import { ContentGrid } from '@/components/home/ContentGrid';
import { fetchContent, MediaType, Region } from '@/lib/tmdb';
import { motion } from 'framer-motion';
import { Filter, Calendar, Globe, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeType, setActiveType] = useState<MediaType>("movie");
  const [activeYear, setActiveYear] = useState<number>(2026);
  const [activeRegion, setActiveRegion] = useState<Region>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const data = await fetchContent(activeType, activeYear, 1, searchQuery, activeRegion);
      setContent(data);
      setLoading(false);
    };
    loadContent();
  }, [activeType, activeYear, activeRegion, searchQuery]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 pb-24 lg:pb-10">
        <TrendingHero />

        <div className="px-6 lg:px-10 -mt-8 relative z-10">
          <div className="glass-card p-6 mb-10 border-white/5">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {["movie", "tv", "anime", "k-drama"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveType(type as MediaType)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
                      activeType === type 
                        ? "bg-primary text-black shadow-lg shadow-primary/20" 
                        : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                    )}
                  >
                    {type === 'tv' ? 'Web Series' : type}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text"
                    placeholder="Search titles, actors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border-none rounded-xl pl-12 pr-6 py-2.5 w-64 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl">
                  {[2027, 2026, 2025, 2024].map((year) => (
                    <button
                      key={year}
                      onClick={() => setActiveYear(year)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                        activeYear === year ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-3">
              {[
                { id: "all", label: "Global", icon: Globe },
                { id: "hollywood", label: "Hollywood" },
                { id: "bollywood", label: "Bollywood" },
                { id: "south-indian", label: "South Indian" },
                { id: "punjabi", label: "Punjabi" },
                { id: "korean", label: "Korean" },
              ].map((region) => (
                <button
                  key={region.id}
                  onClick={() => setActiveRegion(region.id as Region)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    activeRegion === region.id 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  {region.icon && <region.icon size={14} />}
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif font-bold flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full" />
                {activeYear} {activeType === 'tv' ? 'Web Series' : activeType.charAt(0).toUpperCase() + activeType.slice(1)}s
              </h2>
              <p className="text-muted-foreground text-sm font-medium">
                Showing {content.length} titles
              </p>
            </div>

            <ContentGrid items={content} loading={loading} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;