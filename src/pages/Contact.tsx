"use client";

import React from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Mail, Instagram, ExternalLink, Linkedin, Github, Globe } from 'lucide-react';

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
          <h1 className="text-5xl font-serif font-bold mb-4">Contact <span className="text-primary">Us</span></h1>
          <p className="text-xl text-muted-foreground mb-12">Have feedback, suggestions, or collaboration ideas? Let’s connect.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <motion.a
              href="mailto:smdbwork@gmail.com"
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass-card p-8 flex flex-col items-center gap-4 border-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Mail size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold mb-1">Email Us</h3>
                <p className="text-muted-foreground text-sm">Send your queries directly.</p>
              </div>
              <div className="mt-4 text-primary font-bold flex items-center gap-2 text-sm">
                smdbwork@gmail.com
                <ExternalLink size={14} />
              </div>
            </motion.a>

            <motion.a
              href="https://www.linkedin.com/in/sachin-panwar-dezinr"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass-card p-8 flex flex-col items-center gap-4 border-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Linkedin size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold mb-1">LinkedIn</h3>
                <p className="text-muted-foreground text-sm">Connect for professional inquiries.</p>
              </div>
              <div className="mt-4 text-primary font-bold flex items-center gap-2 text-sm">
                Sachin Panwar
                <ExternalLink size={14} />
              </div>
            </motion.a>
          </div>

          <section className="glass-card p-10 border-primary/20 cinematic-glow">
            <h2 className="text-2xl font-serif font-bold mb-6">Developed By Sachin Panwar</h2>
            <p className="text-muted-foreground mb-8">Passionate about building cinematic experiences and robust databases.</p>
            
            <div className="flex justify-center gap-6">
              {[
                { icon: Instagram, href: "https://www.instagram.com/isachin.panwar" },
                { icon: Github, href: "#" },
                { icon: Globe, href: "#" }
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-black transition-all"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </section>

          <footer className="mt-20 text-muted-foreground text-xs space-y-2">
            <p>© 2026 SMDB. All Rights Reserved.</p>
            <p>Unauthorized copying of code, design, or content is strictly prohibited.</p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};

export default Contact;