import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { warmCache } from "@/lib/tmdb";
import Index from "./pages/Index";
import Upcoming from "./pages/Upcoming";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Collection from "./pages/Collection";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Stats from "./pages/Stats";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        warmCache(); // Warm cache for authenticated users
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);

      if (event === 'SIGNED_IN') {
        warmCache();
      }

      if (event === 'PASSWORD_RECOVERY') {
        showSuccess("You can now change your password in your profile settings.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-muted-foreground animate-pulse">Initializing SMDB...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route 
              path="/auth" 
              element={session ? <Navigate to="/" replace /> : <Auth />} 
            />
            <Route 
              path="/" 
              element={session ? <Index /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/upcoming" 
              element={session ? <Upcoming /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/collection" 
              element={session ? <Collection /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/profile" 
              element={session ? <Profile /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/friends" 
              element={session ? <Friends /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/stats" 
              element={session ? <Stats /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/compare/:friendId" 
              element={session ? <Compare /> : <Navigate to="/auth" replace />} 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;