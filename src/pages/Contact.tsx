"use client";

import { Navigation } from '@/components/layout/Navigation';
import { motion } from 'framer-motion';
import { Bug, Lightbulb, Instagram, Linkedin, Code, Sparkles, type LucideIcon } from 'lucide-react';

const SUPPORT_EMAIL = 'smdbwork@gmail.com';
const PORTFOLIO_URL = 'https://sachinpanwar.vercel.app';
const YEAR = new Date().getFullYear();

type SupportLink = {
  title: string;
  subtitle: string;
  subject: string;
  body: string;
  icon: LucideIcon;
};

const SUPPORT_LINKS: SupportLink[] = [
  {
    title: 'Report a Bug',
    subtitle: 'Something not working? Tell us what happened.',
    subject: 'SMDB Bug Report',
    body: 'What happened:\n\nWhat you expected:\n\nDevice and browser:\n',
    icon: Bug,
  },
  {
    title: 'Suggest a Feature',
    subtitle: 'Got an idea to make SMDB better?',
    subject: 'SMDB Feature Idea',
    body: 'My idea:\n\nWhy it would help:\n',
    icon: Lightbulb,
  },
];

const SOCIAL_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/sachin-panwar-dezinr',
    icon: Linkedin,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/isachin.panwar',
    icon: Instagram,
  },
];

const buildMailto = (subject: string, body: string) =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-primary';

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
            Contact <span className="text-primary">Us</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-10 max-w-md mx-auto">
            Found a bug or have an idea for SMDB? Send it our way.
          </p>

          {/* Product support */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUPPORT_LINKS.map(({ title, subtitle, subject, body, icon: Icon }) => (
              <motion.a
                key={title}
                href={buildMailto(subject, body)}
                whileHover={{ scale: 1.02, y: -3 }}
                className={`glass-card p-6 rounded-2xl flex flex-col items-center gap-3 border-white/10 hover:border-primary/50 transition-all group ${focusRing}`}
              >
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight mb-0.5">{title}</h3>
                  <p className="text-muted-foreground text-xs">{subtitle}</p>
                </div>
              </motion.a>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Or write to us at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={`text-primary font-semibold hover:underline rounded ${focusRing}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>

          {/* Creator */}
          <section className="mt-10 glass-card p-6 rounded-2xl border-primary/20 cinematic-glow">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4">
              Built by
            </p>

            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex items-center gap-4 rounded-xl ${focusRing}`}
            >
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <Code size={22} />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-white tracking-tight">Sachin Panwar</h3>
                <p className="text-primary text-xs font-semibold group-hover:underline">View portfolio →</p>
              </div>
            </a>

            <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap justify-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors ${focusRing}`}
                >
                  <Icon size={14} /> {label}
                </a>
              ))}
            </div>
          </section>

          <footer className="mt-14 text-muted-foreground text-xs space-y-1">
            <p>© {YEAR} SMDB. All Rights Reserved.</p>
            <p className="text-primary/90 font-semibold">Crafted for cinephiles and film enthusiasts</p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
};

export default Contact;