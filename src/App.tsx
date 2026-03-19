import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import Index from "./pages/Index";
import Upcoming from "./pages/Upcoming";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Collection from "./pages/Collection";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Stats from "./pages/Stats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
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

  if (!isConfigured && !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle className="text-primary mb-4" size={64} />
        <h1 className="text-2xl font-serif font-bold mb-2">Supabase Not Connected</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          To start tracking your cinema journey, please connect Supabase using the button above the chat.
        </p>
        <div className="flex gap-4">
          <a href="/about" className="text-primary hover:underline">About SMDB</a>
          <span className="text-white/10">|</span>
          <a href="/contact" className="text-primary hover:underline">Contact Support</a>
        </div>
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
            {/* Public Routes */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Auth Route */}
            <Route path="/auth" element={session ? <Navigate to="/" /> : <Auth />} />

            {/* Protected Routes */}
            <Route path="/" element={session ? <Index /> : <Navigate to="/auth" />} />
            <Route path="/upcoming" element={session ? <Upcoming /> : <Navigate to="/auth" />} />
            <Route path="/collection" element={session ? <Collection /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={session ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/friends" element={session ? <Friends /> : <Navigate to="/auth" />} />
            <Route path="/stats" element={session ? <Stats /> : <Navigate to="/auth" />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;