import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { smartWarmCache } from "@/lib/tmdb";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteScrollToTop } from "@/components/layout/RouteScrollToTop";

// The landing page stays in the main bundle; every other page loads on demand
import Index from "./pages/Index";

const Upcoming = lazy(() => import("./pages/Upcoming"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const Collection = lazy(() => import("./pages/Collection"));
const Profile = lazy(() => import("./pages/Profile"));
const Friends = lazy(() => import("./pages/Friends"));
const Stats = lazy(() => import("./pages/Stats"));
const Compare = lazy(() => import("./pages/Compare"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const WARM_CACHE_DELAY_MS = 5000;

/* ------------------------------ helpers ------------------------------ */

const FullScreenLoader = ({ message }: { message: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <Loader2 className="animate-spin text-primary" size={48} />
    <p className="text-muted-foreground animate-pulse">{message}</p>
  </div>
);

// Supabase can emit auth events (token refresh, focus re-checks) with a brand new session
// object even though nothing meaningful changed. Keeping the previous object in that case
// stops the whole route tree from re-rendering.
const isSameSession = (a: Session | null, b: Session | null) =>
  a === b ||
  (!!a && !!b && a.access_token === b.access_token && a.user?.updated_at === b.user?.updated_at);

// One wrapper for every gated page, instead of repeating ProtectedRoute on each route.
// Only these pages wait for the session to resolve; public pages render straight away.
const GatedRoutes = ({ session, loading }: { session: Session | null; loading: boolean }) => {
  if (loading) return <FullScreenLoader message="Initializing SMDB..." />;
  return (
    <ProtectedRoute session={session}>
      <Outlet />
    </ProtectedRoute>
  );
};

/* ------------------------------ app ------------------------------ */

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Runs once: subscribes to auth changes a single time for the life of the app
  useEffect(() => {
    const apply = (next: Session | null) => {
      setSession((prev) => (isSameSession(prev, next) ? prev : next));
      setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => setLoading(false)); // never leave the app stuck on the spinner

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      apply(next);
      if (event === "PASSWORD_RECOVERY") {
        showSuccess("You can now change your password in your profile settings.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Smart warming: a short delay after sign-in. Depends on a boolean, so token
  // refreshes don't restart the timer.
  const isSignedIn = !!session;
  useEffect(() => {
    if (!isSignedIn) return;
    const timer = setTimeout(() => smartWarmCache(), WARM_CACHE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSignedIn]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteScrollToTop />
          <Suspense fallback={<FullScreenLoader message="Loading..." />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/upcoming" element={<Upcoming />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Auth & Login Routes */}
              <Route path="/login" element={<Auth />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />

              {/* Gated Routes */}
              <Route element={<GatedRoutes session={session} loading={loading} />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/compare/:friendId" element={<Compare />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;