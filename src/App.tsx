import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fast session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
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