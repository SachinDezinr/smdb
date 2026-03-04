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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

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
        <p className="text-muted-foreground animate-pulse">Initializing CineTrack...</p>
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
          <a href="/about" className="text-primary hover:underline">About CineTrack</a>
          <span className="text-white/10">|</span>
          <a href="/contact" className="text-primary hover:underline">Contact Support</a>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/upcoming" element={<ProtectedRoute><Upcoming /></ProtectedRoute>} />
          <Route path="/collection" element={<ProtectedRoute><Collection /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;