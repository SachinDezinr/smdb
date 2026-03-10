import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { UsernameSetup } from "@/components/auth/UsernameSetup";
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

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  const checkUsername = async (user: any) => {
    if (!user) return;
    
    const hasUsername = user.user_metadata?.username;
    
    if (!hasUsername) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (!data?.username || data.username.includes('@') || !user.user_metadata?.username) {
        setNeedsUsername(true);
      } else {
        setNeedsUsername(false);
      }
    } else {
      setNeedsUsername(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkUsername(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        await checkUsername(session.user);
      }

      if (event === 'SIGNED_IN') {
        setTimeout(() => setLoading(false), 500);
      } else {
        setLoading(false);
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

  if (session && needsUsername) {
    return <UsernameSetup onComplete={() => setNeedsUsername(false)} />;
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