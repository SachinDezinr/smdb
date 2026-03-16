"use client";

import React, { useState } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Mail, Instagram, Linkedin, Send, MessageSquare, User, AtSign } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Constructing the mailto link to ensure it goes to the specified email
      const subject = `SMDB Contact from ${formData.name}`;
      const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`;
      const mailtoLink = `mailto:smdbwork@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open the user's email client
      window.location.href = mailtoLink;
      
      showSuccess("Opening your email client to send the message!");
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      showError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    {
      name: 'Email',
      icon: <Mail size={20} />,
      href: 'mailto:smdbwork@gmail.com',
      color: 'hover:text-red-400'
    },
    {
      name: 'Instagram',
      icon: <Instagram size={20} />,
      href: 'https://instagram.com/sachinpanwar.in',
      color: 'hover:text-pink-400'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={20} />,
      href: 'https://linkedin.com/in/sachinpanwar-in',
      color: 'hover:text-blue-400'
    }
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-4 lg:p-10 pb-24 lg:pb-10 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full grid md:grid-cols-2 gap-10 items-start"
        >
          {/* Left Side: Info & Socials */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-serif font-bold mb-4">Get in <span className="text-primary">Touch</span></h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Have a suggestion, found a bug, or just want to say hi? We'd love to hear from you.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Connect with us</h3>
              <div className="flex gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 bg-white/5 border border-white/10 rounded-2xl transition-all ${link.color} hover:bg-white/10 hover:scale-110`}
                    title={link.name}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-white/5">
              <p className="text-sm text-muted-foreground">
                Developed by <span className="text-white font-bold">Sachin Panwar</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                © {new Date().getFullYear()} SMDB. All rights reserved.
              </p>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="glass-card p-8 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MessageSquare size={120} />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User size={14} /> Full Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <AtSign size={14} /> Email Address
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MessageSquare size={14} /> Your Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Send size={20} />
                  </motion.div>
                ) : (
                  <>
                    <Send size={20} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Contact;