"use client";

import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Mail, Instagram, ExternalLink } from 'lucide-react';

const Contact = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl text-center"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">Contact <span className="text-primary">Me</span></h1>
          <p className="text-xl text-muted-foreground mb-12">Have feedback, suggestions, or collaboration ideas? Let’s connect.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.a
              href="mailto:sachinpanwarpay@gmail.com"
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card p-8 flex flex-col items-center gap-4 border-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Mail size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold mb-1">Email Me</h3>
                <p className="text-muted-foreground text-sm">Send your queries directly via Gmail.</p>
              </div>
              <div className="mt-4 text-primary font-bold flex items-center gap-2">
                sachinpanwarpay@gmail.com
                <ExternalLink size={14} />
              </div>
            </motion.a>

            <motion.a
              href="https://www.instagram.com/isachin.panwar"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card p-8 flex flex-col items-center gap-4 border-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Instagram size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold mb-1">Instagram</h3>
                <p className="text-muted-foreground text-sm">Follow for updates and cinematic vibes.</p>
              </div>
              <div className="mt-4 text-primary font-bold flex items-center gap-2">
                @isachin.panwar
                <ExternalLink size={14} />
              </div>
            </motion.a>
          </div>

          <footer className="mt-20 text-muted-foreground text-sm">
            <p>Built with passion for cinema.</p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};

export default Contact;