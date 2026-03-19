"use client";

import React from 'react';
import { ContentItem } from '@/lib/tmdb';
import { ContentCard } from '@/components/content/ContentCard';
import { motion } from 'framer-motion';

interface ContentGridProps {
  items: ContentItem[];
}

export const ContentGrid = ({ items }: ContentGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={`${item.id}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (index % 10) * 0.05 }}
        >
          <ContentCard item={item} />
        </motion.div>
      ))}
    </div>
  );
};