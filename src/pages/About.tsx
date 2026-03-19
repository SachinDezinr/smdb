"use client";

import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Film, CheckCircle2, Users, BarChart3, Calendar } from 'lucide-react';

const features = [
  { icon: Calendar, title: "Year-based Browsing", desc: "Explore content organized by release year from 1950 to future." },
  { icon: CheckCircle2, title: "Watch Tracking", desc: "Keep a personal log of every movie and series you've watched." },
  { icon: BarChart3, title: "Live Statistics", desc: "Get detailed insights into your viewing habits and yearly wrapped." },
  { icon: Users, title: "Friend System", desc: "Compare collections and see what your friends are watching." },
];

const About = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-4">About <span className="text-primary">SMDB</span></h1>
          <p className="text-xl text-muted-foreground">Track what you watch. Discover what’s next.</p>
        </motion.div>

        <div className="space-y-12">
          <section className="glass-card p-8 border-primary/20 cinematic-glow">
            <h2 className="text-2xl font-serif font-bold mb-4 text-primary">What is SMDB?</h2>
            <p className="text-lg leading-relaxed text-white/80 mb-6">
              SMDB (Shows & Movies Database) is a premium content tracking and statistics platform designed for true cinema lovers. 
              It is <span className="text-primary font-bold">NOT</span> a streaming service. We provide the tools 
              to organize your cinematic journey, from Hollywood blockbusters to niche Anime and K-Dramas.
            </p>
            <p className="text-sm text-muted-foreground italic">
              SMDB uses the TMDB API for content information and metadata.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 hover:border-primary/50 transition-colors group"
              >
                <f.icon className="text-primary mb-4 group-hover:scale-110 transition-transform" size={32} />
                <h3 className="text-xl font-serif font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <section className="text-center py-12">
            <h2 className="text-3xl font-serif font-bold mb-8">How It Works</h2>
            <div className="flex flex-col md:flex-row justify-between gap-8">
              {[
                "Browse by Year",
                "Add to Watched",
                "View Collection",
                "Compare with Friends"
              ].map((step, i) => (
                <div key={i} className="flex-1 relative">
                  <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                    {i + 1}
                  </div>
                  <p className="font-medium">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center pt-10">
            <p className="text-2xl font-serif font-bold text-primary italic">
              "SMDB helps you build your cinematic journey."
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;