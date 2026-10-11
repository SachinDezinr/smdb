"use client";

import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Users, BarChart3, Calendar, Sparkles, Film } from 'lucide-react';

const features = [
  { icon: Calendar, title: "Year-based Catalog", desc: "Explore content organized chronologically from 1950 to future releases." },
  { icon: CheckCircle2, title: "Instant Watch Log", desc: "Track every movie, web series, anime, and drama with a single tap." },
  { icon: BarChart3, title: "Yearly Wrapped & Stats", desc: "Get rich visual summaries and analytics of your viewing habits." },
  { icon: Users, title: "Friend Comparison", desc: "Compare vaults with friends and calculate taste compatibility scores." },
];

const About = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-4xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            <Sparkles size={13} /> Platform Overview
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-3">
            About <span className="text-primary">SMDB</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto">
            Track what you watch. Unpack your cinematic milestones.
          </p>
        </motion.div>

        <div className="space-y-10">
          {/* Mission Statement */}
          <section className="glass-card p-6 md:p-8 border-primary/20 rounded-3xl cinematic-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center text-primary">
                <Film size={20} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">What is SMDB?</h2>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-white/80 mb-4">
              SMDB (Shows & Movies Database) is a dedicated tracking and taste analytics platform built for cinema lovers. 
              We are <span className="text-primary font-bold">NOT</span> a streaming service. Instead, we give you clean, intuitive tools to catalogue your watch history and connect with fellow cinephiles.
            </p>
            <p className="text-xs text-muted-foreground">
              Metadata and poster artwork powered by The Movie Database (TMDB) API.
            </p>
          </section>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-6 rounded-2xl border-white/10 hover:border-primary/40 transition-colors group"
              >
                <f.icon className="text-primary mb-3 group-hover:scale-110 transition-transform" size={26} />
                <h3 className="text-lg font-bold text-white tracking-tight mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Workflow Steps */}
          <section className="glass-card p-6 md:p-8 rounded-3xl border-white/10 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-8">How It Works</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                "Browse by Year",
                "Add to Watched",
                "View Collection",
                "Compare Friends"
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-11 h-11 bg-primary text-black rounded-2xl flex items-center justify-center font-bold text-base shadow-md shadow-primary/20 mb-3">
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold text-white tracking-tight">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center pt-6">
            <p className="text-lg md:text-xl font-bold text-primary italic">
              "Track your cinematic journey with clarity."
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;