import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Route,
  Routes,
  BrowserRouter,
} from "react-router-dom";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { Loader2 } from "lucide-react";

import { Toaster } from "@/components/ui/toaster";
import {
  Toaster as Sonner,
} from "@/components/ui/sonner";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  Session,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { showSuccess } from "@/utils/toast";
import { smartWarmCache } from "@/lib/tmdb";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteScrollToTop } from "@/components/layout/RouteScrollToTop";

/* -------------------------------------------------------------------------- */
/* Lazy-loaded pages                                                          */
/* -------------------------------------------------------------------------- */

const Index = lazy(
  () => import("./pages/Index"),
);

const Upcoming = lazy(
  () => import("./pages/Upcoming"),
);

const Recommendations = lazy(
  () => import("./pages/Recommendations"),
);

const About = lazy(
  () => import("./pages/About"),
);

const Contact = lazy(
  () => import("./pages/Contact"),
);

const Auth = lazy(
  () => import("./pages/Auth"),
);

const Collection = lazy(
  () => import("./pages/Collection"),
);

const Profile = lazy(
  () => import("./pages/Profile"),
);

const Friends = lazy(
  () => import("./pages/Friends"),
);

const Stats = lazy(
  () => import("./pages/Stats"),
);

const Compare = lazy(
  () => import("./pages/Compare"),
);

const NotFound = lazy(
  () => import("./pages/NotFound"),
);

/* -------------------------------------------------------------------------- */
/* React Query                                                                */
/* -------------------------------------------------------------------------- */

const queryClient =
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:
          5 * 60 * 1000,

        gcTime:
          30 * 60 * 1000,

        retry: 1,

        refetchOnWindowFocus: false,
      },
    },
  });

/* -------------------------------------------------------------------------- */
/* Loading UI                                                                 */
/* -------------------------------------------------------------------------- */

const PageLoader = () => (
  <div
    className="
      min-h-screen
      flex
      flex-col
      items-center
      justify-center
      gap-4
      bg-background
    "
    role="status"
    aria-label="Loading page"
  >
    <Loader2
      className="animate-spin text-primary"
      size={40}
      aria-hidden="true"
    />

    <p className="text-sm text-muted-foreground">
      Loading SMDB...
    </p>
  </div>
);

/* -------------------------------------------------------------------------- */
/* App                                                                        */
/* -------------------------------------------------------------------------- */

const App = () => {
  const [
    session,
    setSession,
  ] = useState<Session | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "[Auth] Failed to restore session:",
            error.message,
          );
        }

        setSession(
          data.session ?? null,
        );

        setLoading(false);
      };

    void initializeAuth();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(
            nextSession ?? null,
          );

          setLoading(false);

          if (
            event ===
            "PASSWORD_RECOVERY"
          ) {
            showSuccess(
              "You can now change your password in your profile settings.",
            );
          }
        },
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Smart TMDB cache warming                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!session) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        void smartWarmCache();
      },
      5000,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [session]);

  /* ------------------------------------------------------------------------ */
  /* Initial loading                                                          */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return <PageLoader />;
  }

  /* ------------------------------------------------------------------------ */
  /* Routes                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <QueryClientProvider
      client={queryClient}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <RouteScrollToTop />

          <Suspense
            fallback={<PageLoader />}
          >
            <Routes>
              {/* ------------------------------------------------------------ */}
              {/* Public routes                                                 */}
              {/* ------------------------------------------------------------ */}

              <Route
                path="/"
                element={<Index />}
              />

              <Route
                path="/upcoming"
                element={<Upcoming />}
              />

              <Route
                path="/recommendations"
                element={
                  <Recommendations />
                }
              />

              <Route
                path="/about"
                element={<About />}
              />

              <Route
                path="/contact"
                element={<Contact />}
              />

              {/* ------------------------------------------------------------ */}
              {/* Authentication                                                */}
              {/* ------------------------------------------------------------ */}

              <Route
                path="/login"
                element={<Auth />}
              />

              <Route
                path="/auth"
                element={
                  <Navigate
                    to="/login"
                    replace
                  />
                }
              />

              {/* ------------------------------------------------------------ */}
              {/* Protected routes                                              */}
              {/* ------------------------------------------------------------ */}

              <Route
                path="/profile"
                element={
                  <ProtectedRoute
                    session={session}
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/collection"
                element={
                  <ProtectedRoute
                    session={session}
                  >
                    <Collection />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/friends"
                element={
                  <ProtectedRoute
                    session={session}
                  >
                    <Friends />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stats"
                element={
                  <ProtectedRoute
                    session={session}
                  >
                    <Stats />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/compare/:friendId"
                element={
                  <ProtectedRoute
                    session={session}
                  >
                    <Compare />
                  </ProtectedRoute>
                }
              />

              {/* ------------------------------------------------------------ */}
              {/* 404                                                           */}
              {/* ------------------------------------------------------------ */}

              <Route
                path="*"
                element={<NotFound />}
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;