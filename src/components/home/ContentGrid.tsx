"use client";

import React from 'react';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentItem } from '@/lib/tmdb';
import { motion } from 'framer-motion';

interface ContentGridProps {
  items: ContentItem[];
  loading: boolean;
}

export const ContentGrid = ({ items, loading }: ContentGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ContentCard item={item} />
        </motion.div>
      ))}
    </div>
  );
};