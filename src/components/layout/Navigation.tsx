"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  Library,
  User,
  Film,
  BarChart3,
  Users,
  ChevronRight,
  Compass,
  Sparkles,
  LogOut,
  LogIn,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  fetchProfileData,
  clearCachedProfile,
  getCachedAuthState,
  setCachedAuthState,
  getCachedProfile,
} from "@/lib/profileStore";
import {
  clearCachedStats,
  clearCachedSocialCircle,
} from "@/lib/pageDataStore";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type NavigationIcon = React.ComponentType<{
  size?: number;
  className?: string;
}>;

interface NavItem {
  icon: NavigationIcon;
  label: string;
  path: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* -------------------------------------------------------------------------- */
/* Navigation Data                                                            */
/* -------------------------------------------------------------------------- */

const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: "Discover",
    items: [
      { icon: Compass, label: "Explore Catalog", path: "/" },
      { icon: Calendar, label: "Upcoming", path: "/upcoming" },
      {
        icon: Sparkles,
        label: "Recommendations",
        path: "/recommendations",
      },
    ],
  },
  {
    title: "My Vault",
    items: [
      { icon: Library, label: "Collection", path: "/collection" },
      { icon: BarChart3, label: "Analytics & Stats", path: "/stats" },
    ],
  },
  {
    title: "Community",
    items: [
      { icon: Users, label: "Social Circle", path: "/friends" },
      { icon: User, label: "Profile & Settings", path: "/profile" },
    ],
  },
];

const MOBILE_NAV_ITEMS: readonly NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Sparkles, label: "Picks", path: "/recommendations" },
  { icon: Calendar, label: "Upcoming", path: "/upcoming" },
  { icon: Library, label: "Collection", path: "/collection" },
  { icon: User, label: "Profile", path: "/profile" },
];

const TABLET_NAV_ITEMS: readonly NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  {
    icon: Sparkles,
    label: "Recommendations",
    path: "/recommendations",
  },
  { icon: Calendar, label: "Upcoming", path: "/upcoming" },
  { icon: Library, label: "Collection", path: "/collection" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: User, label: "Profile", path: "/profile" },
];

/* -------------------------------------------------------------------------- */
/* Shared Styles                                                              */
/* -------------------------------------------------------------------------- */

const BOTTOM_NAV_CLASSES = {
  wrapper:
    "fixed inset-x-0 bottom-2.5 sm:bottom-3 z-50 flex justify-center px-4 pointer-events-none pb-[env(safe-area-inset-bottom)] transform-gpu",
  nav: "pointer-events-auto w-full max-w-sm h-[57px] bg-neutral-950/95 backdrop-blur-xl border border-white/15 rounded-full px-2 shadow-[0_8px_28px_rgba(0,0,0,0.85)] ring-1 ring-white/10 flex items-center justify-between gap-1 transform-gpu",
  item:
    "relative flex flex-1 items-center justify-center h-11 rounded-full select-none transform-gpu transition-colors duration-200 active:scale-95",
  activeBackground:
    "absolute inset-0 rounded-full bg-primary/15 border border-primary/30 transition-all duration-200 ease-out",
  inactiveBackground:
    "absolute inset-0 rounded-full opacity-0 scale-90 pointer-events-none",
  content:
    "relative z-10 flex flex-col items-center gap-0.5",
  icon:
    "transition-transform duration-200 transform-gpu",
  label:
    "text-[9.5px] font-semibold tracking-tight transition-colors duration-200",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isPathActive = (pathname: string, path: string): boolean => {
  if (path === "/") {
    return pathname === "/";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
};

/* -------------------------------------------------------------------------- */
/* Desktop Sidebar                                                            */
/* -------------------------------------------------------------------------- */

interface DesktopSidebarProps {
  pathname: string;
  isAuthenticated: boolean;
  pendingCount: number;
  onLogout: () => void;
}

const DesktopSidebar = memo(function DesktopSidebar({
  pathname,
  isAuthenticated,
  pendingCount,
  onLogout,
}: DesktopSidebarProps) {
  return (
    <aside
      className="
        hidden lg:flex
        sticky top-0
        z-40
        h-screen w-72
        flex-col
        justify-between
        select-none
        border-r border-white/10
        bg-neutral-950/70
        px-5 py-6
        backdrop-blur-2xl
      "
      aria-label="Main navigation"
    >
      {/* Ambient glow */}
      <div
        className="
          pointer-events-none
          absolute left-0 top-0
          h-40 w-full
          bg-gradient-to-b
          from-primary/[0.07]
          to-transparent
        "
      />

      {/* Top */}
      <div className="relative">
        {/* Branding */}
        <Link
          to="/"
          className="
            group mb-8 flex items-center
            gap-3.5 px-2 py-1.5
          "
          aria-label="SMDB home"
        >
          <div className="relative shrink-0">
            <div
              className="
                absolute -inset-1
                rounded-2xl
                bg-primary/30
                blur-sm
                transition-all
                group-hover:bg-primary/50
              "
            />

            <div
              className="
                relative flex h-11 w-11
                items-center justify-center
                rounded-xl
                border border-white/20
                bg-gradient-to-br
                from-[#FFE799]
                via-primary
                to-[#D69E0A]
                shadow-lg shadow-primary/20
                transition-transform
                group-hover:scale-105
              "
            >
              <Film
                className="text-black/90"
                size={22}
                strokeWidth={2.2}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <span
              className="
                font-['Poppins']
                text-xl font-black
                tracking-tight text-white
              "
            >
              SMDB
            </span>

            <span
              className="
                text-[10px]
                font-semibold uppercase
                tracking-wider
                text-muted-foreground
              "
            >
              Cinema Log & Vault
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="space-y-1.5"
            >
              <p
                className="
                  px-3
                  text-[10px]
                  font-bold uppercase
                  tracking-widest
                  text-muted-foreground/70
                "
              >
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isPathActive(
                    pathname,
                    item.path
                  );

                  const showBadge =
                    item.path === "/friends" &&
                    pendingCount > 0;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={
                        active ? "page" : undefined
                      }
                      className={cn(
                        `
                          group relative flex
                          items-center justify-between
                          rounded-xl px-3.5 py-2.5
                          text-sm font-semibold
                          transition-all duration-200
                        `,
                        active
                          ? "font-bold text-black"
                          : "text-muted-foreground hover:bg-white/[0.04] hover:text-white"
                      )}
                    >
                      {/* Active background */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          `
                            absolute inset-0
                            rounded-xl
                            bg-primary
                            shadow-lg shadow-primary/25
                            transition-all duration-200
                          `,
                          active
                            ? "scale-100 opacity-100"
                            : "pointer-events-none scale-95 opacity-0"
                        )}
                      />

                      <span className="relative z-10 flex items-center gap-3">
                        <Icon
                          size={18}
                          className={cn(
                            "transition-transform duration-200 group-hover:scale-110",
                            active
                              ? "text-black"
                              : "text-muted-foreground group-hover:text-primary"
                          )}
                        />

                        <span>{item.label}</span>
                      </span>

                      {/* Pending badge */}
                      {showBadge && (
                        <span
                          className={cn(
                            `
                              relative z-10
                              rounded-full
                              px-2 py-0.5
                              text-[10px]
                              font-extrabold
                              uppercase
                              tracking-wide
                            `,
                            active
                              ? "border border-black/30 bg-black text-primary"
                              : "animate-pulse bg-red-500 text-white"
                          )}
                        >
                          {pendingCount} new
                        </span>
                      )}

                      {/* Arrow */}
                      {!active && (
                        <ChevronRight
                          size={14}
                          aria-hidden="true"
                          className="
                            text-muted-foreground
                            opacity-0
                            -translate-x-2
                            transition-all duration-200
                            group-hover:translate-x-0
                            group-hover:opacity-60
                          "
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div
        className="
          space-y-3
          border-t border-white/10
          pt-4
        "
      >
        {isAuthenticated ? (
          <button
            type="button"
            onClick={onLogout}
            className="
              group flex w-full
              items-center gap-3
              rounded-xl
              border border-red-500/20
              bg-red-500/10
              px-3.5 py-2.5
              text-sm font-semibold
              text-red-400
              transition-all
              hover:border-red-500/40
              hover:bg-red-500/20
              hover:text-red-300
            "
          >
            <LogOut
              size={18}
              className="
                transition-transform
                group-hover:-translate-x-0.5
              "
            />

            <span>Sign Out</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="
              flex w-full
              items-center gap-3
              rounded-xl
              bg-primary
              px-3.5 py-2.5
              text-sm font-bold text-black
              shadow-md shadow-primary/20
              transition-all
              hover:bg-primary/90
            "
          >
            <LogIn size={18} />
            <span>Sign In / Register</span>
          </Link>
        )}

        <div
          className="
            flex items-center justify-between
            px-1.5
            text-[11px]
            text-muted-foreground/70
          "
        >
          <Link
            to="/about"
            className="transition-colors hover:text-white"
          >
            About
          </Link>

          <span aria-hidden="true">•</span>

          <Link
            to="/contact"
            className="transition-colors hover:text-white"
          >
            Support
          </Link>

          <span aria-hidden="true">•</span>

          <span className="text-[10px]">v1.1</span>
        </div>
      </div>
    </aside>
  );
});

/* -------------------------------------------------------------------------- */
/* Bottom Navigation                                                          */
/* -------------------------------------------------------------------------- */

interface BottomNavigationProps {
  pathname: string;
  items: readonly NavItem[];
  pendingCount: number;
  variant: "mobile" | "tablet";
}

const BottomNavigation = memo(function BottomNavigation({
  pathname,
  items,
  pendingCount,
  variant,
}: BottomNavigationProps) {
  const isTablet = variant === "tablet";

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-3 z-50 justify-center px-6 pointer-events-none pb-[env(safe-area-inset-bottom)] transform-gpu",
        isTablet
          ? "hidden md:flex lg:hidden"
          : "flex md:hidden bottom-2.5 sm:bottom-3 px-4"
      )}
    >
      <nav
        className={cn(
          BOTTOM_NAV_CLASSES.nav,
          isTablet && "max-w-md h-[58px]"
        )}
        aria-label={
          isTablet
            ? "Tablet navigation"
            : "Mobile navigation"
        }
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(
            pathname,
            item.path
          );

          const showBadge =
            item.path === "/profile" &&
            !isTablet &&
            pendingCount > 0;

          const showFriendsBadge =
            item.path === "/friends" &&
            isTablet &&
            pendingCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={
                active ? "page" : undefined
              }
              className={cn(
                BOTTOM_NAV_CLASSES.item,
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {/* Active background */}
              <span
                aria-hidden="true"
                className={cn(
                  active
                    ? BOTTOM_NAV_CLASSES.activeBackground
                    : BOTTOM_NAV_CLASSES.inactiveBackground
                )}
              />

              <span className={BOTTOM_NAV_CLASSES.content}>
                <span className="relative">
                  <Icon
                    size={18}
                    className={cn(
                      BOTTOM_NAV_CLASSES.icon,
                      active
                        ? "scale-110 text-primary"
                        : "text-muted-foreground"
                    )}
                  />

                  {(showBadge ||
                    showFriendsBadge) && (
                    <span
                      className="
                        absolute -right-1.5 -top-1
                        h-2 w-2
                        rounded-full
                        border-2 border-neutral-950
                        bg-red-500
                      "
                    />
                  )}
                </span>

                <span
                  className={cn(
                    BOTTOM_NAV_CLASSES.label,
                    active
                      ? "font-bold text-primary"
                      : "text-muted-foreground/80"
                  )}
                >
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* Navigation Component                                                       */
/* -------------------------------------------------------------------------- */

export const Navigation = memo(function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(() => {
      const cachedAuth = getCachedAuthState();

      if (cachedAuth !== null) {
        return cachedAuth;
      }

      return !!getCachedProfile()?.user;
    });

  const [pendingCount, setPendingCount] =
    useState<number>(
      () => getCachedProfile()?.pendingCount ?? 0
    );

  /* ------------------------------------------------------------------------ */
  /* Auth Listener                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;
    let requestId = 0;

    const updateAuthState = async (
      sessionUserExists: boolean,
      forceRefresh: boolean
    ) => {
      if (!mounted) return;

      setIsAuthenticated(sessionUserExists);
      setCachedAuthState(sessionUserExists);

      if (!sessionUserExists) {
        setPendingCount(0);
        return;
      }

      const currentRequest = ++requestId;

      try {
        const data = await fetchProfileData(
          forceRefresh
        );

        /*
         * Ignore stale requests. This prevents an older
         * profile response from overwriting newer auth state.
         */
        if (
          mounted &&
          currentRequest === requestId &&
          data
        ) {
          setPendingCount(data.pendingCount ?? 0);
        }
      } catch (error) {
        if (mounted) {
          console.error(
            "Failed to fetch profile data:",
            error
          );
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await updateAuthState(
          !!session?.user,
          event !== "INITIAL_SESSION"
        );
      }
    );

    return () => {
      mounted = false;
      requestId++;
      subscription.unsubscribe();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleLogout = useCallback(async () => {
    /*
     * Clear UI/cache immediately so the interface responds
     * without waiting for Supabase.
     */
    clearCachedProfile();
    clearCachedStats();
    clearCachedSocialCircle();

    setCachedAuthState(false);
    setIsAuthenticated(false);
    setPendingCount(0);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ------------------------------------------------------------------------ */
  /* Current Navigation                                                       */
  /* ------------------------------------------------------------------------ */

  const pathname = location.pathname;

  /*
   * These references stay stable and avoid recreating navigation
   * arrays on every render.
   */
  const mobileItems = useMemo(
    () => MOBILE_NAV_ITEMS,
    []
  );

  const tabletItems = useMemo(
    () => TABLET_NAV_ITEMS,
    []
  );

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <DesktopSidebar
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        pendingCount={pendingCount}
        onLogout={handleLogout}
      />

      <BottomNavigation
        pathname={pathname}
        items={mobileItems}
        pendingCount={pendingCount}
        variant="mobile"
      />

      <BottomNavigation
        pathname={pathname}
        items={tabletItems}
        pendingCount={pendingCount}
        variant="tablet"
      />
    </>
  );
});

Navigation.displayName = "Navigation";