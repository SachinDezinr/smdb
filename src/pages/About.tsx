"use client";

import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Film, Heart, Shield, Zap } from 'lucide-react';

const About = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
              <Film size={40} className="text-black" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold">About <span className="text-primary">SMDB</span></h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your personal cinematic companion for tracking, discovering, and sharing your love for movies and series.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-8 border-white/5 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Heart size={24} />
              </div>
              <h3 className="text-xl font-bold">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                We built SMDB to solve the "what should we watch?" dilemma. By connecting friends and comparing collections, we make discovery social and fun.
              </p>
            </div>

            <div className="glass-card p-8 border-white/5 space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold">Fast & Fluid</h3>
              <p className="text-muted-foreground leading-relaxed">
                Experience a cinematic interface that's as smooth as the movies you watch. No clutter, just your content front and center.
              </p>
            </div>
          </div>

          <section className="glass-card p-8 border-white/5 text-center space-y-6">
            <Shield className="mx-auto text-primary" size={48} />
            <h2 className="text-2xl font-bold">Privacy First</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your data is yours. We use secure industry-standard encryption to ensure your watchlist and profile remain private and safe.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default About;