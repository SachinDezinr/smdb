"use client";

import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Film } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center glass-card border-white/10 rounded-3xl p-10 max-w-sm">
          <Film className="mx-auto mb-4 text-primary/40" size={48} />
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mb-2">404</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This page isn't in the catalog.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-black font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;