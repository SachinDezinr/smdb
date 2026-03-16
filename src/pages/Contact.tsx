"use client";

import React, { useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, Github, Twitter } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const Contact = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      showSuccess("Message sent! We'll get back to you soon.");
      setSending(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <header className="text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold">Get in <span className="text-primary">Touch</span></h1>
            <p className="text-muted-foreground">Have feedback or need help? We're here for you.</p>
          </header>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="glass-card p-8 border-white/5 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Name</label>
                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</label>
                    <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Message</label>
                  <textarea required rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none resize-none" placeholder="How can we help?"></textarea>
                </div>
                <button disabled={sending} className="w-full bg-primary text-black py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  {sending ? "Sending..." : <><Send size={18} /> Send Message</>}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 border-white/5 space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Mail size={18} className="text-primary" /> Email Us</h3>
                <p className="text-sm text-muted-foreground">support@smdb.app</p>
              </div>
              <div className="glass-card p-6 border-white/5 space-y-4">
                <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18} className="text-primary" /> Socials</h3>
                <div className="flex gap-4">
                  <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Twitter size={20} /></button>
                  <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Github size={20} /></button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Contact;