"use client";

import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Mail, Instagram, ExternalLink, Linkedin, Code } from 'lucide-react';

/**
 * Contact Page: Provides ways to connect with the developer and SMDB team.
 */
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
          <h1 className="text-5xl font-serif font-bold mb-4">Contact <span className="text-primary">SMDB</span></h1>
          <p className="text-xl text-muted-foreground mb-12">Have feedback, suggestions, or collaboration ideas? Let’s connect.</p>

          {/* Contact Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.a
              href="mailto:smdbwork@gmail.com"
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass-card p-6 flex flex-col items-center gap-4 border-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold mb-1">Email Us</h3>
                <p className="text-muted-foreground text-xs">smdbwork@gmail.com</p>
              </div>
            </motion.a>

            <motion.a
              href="https://www.linkedin.com/in/sachin-panwar-dezinr"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass-card p-6 flex flex-col items-center gap-4 border-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Linkedin size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold mb-1">LinkedIn</h3>
                <p className="text-muted-foreground text-xs">Connect professionally</p>
              </div>
            </motion.a>

            <motion.a
              href="https://www.instagram.com/isachin.panwar"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass-card p-6 flex flex-col items-center gap-4 border-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Instagram size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold mb-1">Instagram</h3>
                <p className="text-muted-foreground text-xs">@isachin.panwar</p>
              </div>
            </motion.a>

            <div className="glass-card p-6 flex flex-col items-center gap-4 border-primary/20 cinematic-glow">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black">
                <Code size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold mb-1">Developed By</h3>
                <p className="text-primary font-bold">Sachin Panwar</p>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <footer className="mt-20 text-muted-foreground text-sm space-y-1">
            <p>© 2026 SMDB. All Rights Reserved.</p>
            <p className="text-primary/80 font-medium">Built with passion for Cinephiles</p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};

export default Contact;