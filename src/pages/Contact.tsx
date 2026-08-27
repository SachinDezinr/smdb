"use client";

import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Mail, Instagram, Linkedin, Code, Sparkles } from 'lucide-react';

const Contact = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            <Sparkles size={13} /> Get In Touch
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-3">
            Contact <span className="text-primary">SMDB</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-10 max-w-md mx-auto">
            Have feedback, feature ideas, or bug reports? Reach out directly.
          </p>

          {/* Contact Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.a
              href="mailto:smdbwork@gmail.com"
              whileHover={{ scale: 1.02, y: -3 }}
              className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 border-white/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight mb-0.5">Email Support</h3>
                <p className="text-muted-foreground text-xs">smdbwork@gmail.com</p>
              </div>
            </motion.a>

            <motion.a
              href="https://www.linkedin.com/in/sachin-panwar-dezinr"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -3 }}
              className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 border-white/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Linkedin size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight mb-0.5">LinkedIn</h3>
                <p className="text-muted-foreground text-xs">Connect professionally</p>
              </div>
            </motion.a>

            <motion.a
              href="https://www.instagram.com/isachin.panwar"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -3 }}
              className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 border-white/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Instagram size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight mb-0.5">Instagram</h3>
                <p className="text-muted-foreground text-xs">@isachin.panwar</p>
              </div>
            </motion.a>

            <div className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 border-primary/20 cinematic-glow">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black shadow-md shadow-primary/20">
                <Code size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight mb-0.5">Developed By</h3>
                <p className="text-primary font-bold text-xs">Sachin Panwar</p>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <footer className="mt-14 text-muted-foreground text-xs space-y-1">
            <p>© 2026 SMDB. All Rights Reserved.</p>
            <p className="text-primary/90 font-semibold">Crafted for cinephiles and film enthusiasts</p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};

export default Contact;