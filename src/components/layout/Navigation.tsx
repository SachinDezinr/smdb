"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
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
import { motion, MotionConfig } from "framer-motion";
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

/* ------------------------------ data ------------------------------ */

type IconType = React.ComponentType<{ size?: number; className?: string }>;

interface NavItem {
  icon: IconType;
  label: string;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Discover",
    items: [
      { icon: Compass, label: "Explore Catalog", path: "/" },
      { icon: Calendar, label: "Upcoming", path: "/upcoming" },
      { icon: Sparkles, label: "Recommendations", path: "/recommendations" },
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

const mobileNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Upcoming", path: "/upcoming" },
  { icon: Sparkles, label: "Picks", path: "/recommendations" },
  { icon: Library, label: "Collection", path: "/collection" },
  { icon: User, label: "Profile", path: "/profile" },
];

const tabletNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Upcoming", path: "/upcoming" },
  { icon: Sparkles, label: "Picks", path: "/recommendations" },
  { icon: Library, label: "Collection", path: "/collection" },
  { icon: Users, label: "Friends", path: "/friends" },
  { icon: User, label: "Profile", path: "/profile" },
];

/** "/" only matches itself; other routes also match their children (/collection/123). */
const isPathActive = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

/* ------------------------------ sidebar (desktop) ------------------------------ */

const SidebarLink = memo(function SidebarLink({
  item,
  isActive,
  badge,
}: {
  item: NavItem;
  isActive: boolean;
  badge?: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200",
        focusRing,
        isActive
          ? "font-bold text-black"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-white"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="desktop-active-pill"
          className="absolute inset-0 -z-10 rounded-xl bg-primary shadow-lg shadow-primary/25"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}

      <div className="flex items-center gap-3">
        <Icon
          size={18}
          className={cn(
            "transition-transform duration-200 group-hover:scale-110",
            isActive ? "text-black" : "group-hover:text-primary"
          )}
        />
        <span>{item.label}</span>
      </div>

      {badge ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide",
            isActive
              ? "border border-black/30 bg-black text-primary"
              : "bg-red-500 text-white motion-safe:animate-pulse"
          )}
        >
          {badge > 99 ? "99+" : badge} new
        </span>
      ) : null}

      {!isActive && (
        <ChevronRight
          size={14}
          aria-hidden="true"
          className="-translate-x-2 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-60"
        />
      )}
    </Link>
  );
});

/* ------------------------------ bottom bar (mobile + tablet) ------------------------------ */

const BottomNavLink = memo(function BottomNavLink({
  item,
  isActive,
  showBadge,
  pillId,
}: {
  item: NavItem;
  isActive: boolean;
  showBadge: boolean;
  pillId: string;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-11 min-w-0 flex-1 select-none flex-col items-center justify-center rounded-full transition-colors duration-200 active:scale-95",
        focusRing,
        isActive ? "text-primary" : "text-muted-foreground active:text-white"
      )}
    >
      {isActive && (
        <motion.div
          layoutId={pillId}
          className="absolute inset-0 -z-10 rounded-full border border-primary/30 bg-primary/15"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}

      <div className="relative flex flex-col items-center gap-0.5">
        <div className="relative">
          <Icon
            size={18}
            className={cn(
              "transition-transform duration-200",
              isActive && "scale-110"
            )}
          />
          {showBadge && (
            <>
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full border-2 border-neutral-950 bg-red-500"
              />
              <span className="sr-only">New requests</span>
            </>
          )}
        </div>

        <span
          className={cn(
            "text-[10px] font-semibold tracking-tight transition-colors duration-200",
            isActive ? "font-bold text-primary" : "text-muted-foreground/80"
          )}
        >
          {item.label}
        </span>
      </div>
    </Link>
  );
});

const BottomNav = memo(function BottomNav({
  items,
  pathname,
  pillId,
  badgePath,
  pendingCount,
  wrapperClassName,
  navClassName,
}: {
  items: NavItem[];
  pathname: string;
  pillId: string;
  badgePath: string;
  pendingCount: number;
  wrapperClassName: string;
  navClassName: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 justify-center pb-[env(safe-area-inset-bottom)]",
        wrapperClassName
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "pointer-events-auto flex h-[58px] w-full items-center justify-between gap-1.5 rounded-full border border-white/15 bg-neutral-950/95 px-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-xl",
          navClassName
        )}
      >
        {items.map((item) => (
          <BottomNavLink
            key={item.path}
            item={item}
            pillId={pillId}
            isActive={isPathActive(pathname, item.path)}
            showBadge={item.path === badgePath && pendingCount > 0}
          />
        ))}
      </nav>
    </div>
  );
});

/* ------------------------------ component ------------------------------ */

export const Navigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const cachedAuth = getCachedAuthState();
    if (cachedAuth !== null) return cachedAuth;
    return !!getCachedProfile()?.user;
  });

  const [pendingCount, setPendingCount] = useState<number>(
    () => getCachedProfile()?.pendingCount || 0
  );

  useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        const isAuth = !!session?.user;
        setIsAuthenticated(isAuth);
        setCachedAuthState(isAuth);

        if (!session?.user) {
          setPendingCount(0);
          return;
        }

        // A silent token refresh doesn't change the profile; skip the refetch.
        if (event === "TOKEN_REFRESHED") return;

        // Defer: awaiting Supabase calls inside this callback can deadlock the auth client.
        setTimeout(async () => {
          try {
            const data = await fetchProfileData(event !== "INITIAL_SESSION");
            if (isMounted && data) setPendingCount(data.pendingCount);
          } catch (error) {
            console.error("Profile refresh failed:", error);
          }
        }, 0);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = useCallback(async () => {
    clearCachedProfile();
    clearCachedStats();
    clearCachedSocialCircle();
    setCachedAuthState(false);
    setIsAuthenticated(false);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <MotionConfig reducedMotion="user">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-40 hidden h-screen w-72 select-none flex-col justify-between border-r border-white/10 bg-neutral-950/70 px-5 py-6 backdrop-blur-2xl lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-40 w-full bg-gradient-to-b from-primary/[0.07] to-transparent"
        />

        <div>
          <Link
            to="/"
            className={cn("group mb-8 flex items-center gap-3.5 rounded-xl px-2 py-1.5", focusRing)}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-primary/30 blur-sm transition-colors group-hover:bg-primary/50" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-[#FFE799] via-primary to-[#D69E0A] shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Film className="text-black/90" size={22} strokeWidth={2.2} />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-['Poppins'] text-xl font-black tracking-tight text-white">
                SMDB
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Cinema log and vault
              </span>
            </div>
          </Link>

          <nav aria-label="Primary" className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <p className="px-3 text-[11px] font-semibold text-muted-foreground/70">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarLink
                      key={item.path}
                      item={item}
                      isActive={isPathActive(pathname, item.path)}
                      badge={item.path === "/friends" ? pendingCount : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300",
                focusRing
              )}
            >
              <LogOut
                size={18}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              <span>Sign out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-black shadow-md shadow-primary/20 transition-colors hover:bg-primary/90",
                focusRing
              )}
            >
              <LogIn size={18} />
              <span>Sign in or register</span>
            </Link>
          )}

          <div className="flex items-center justify-between px-1.5 text-[11px] text-muted-foreground/70">
            <Link to="/about" className="transition-colors hover:text-white">
              About
            </Link>
            <Link to="/contact" className="transition-colors hover:text-white">
              Support
            </Link>
            <span className="text-[10px]">v1.1</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <BottomNav
        items={mobileNavItems}
        pathname={pathname}
        pillId="mobile-active-pill"
        badgePath="/profile"
        pendingCount={pendingCount}
        wrapperClassName="bottom-2.5 flex px-4 sm:bottom-3 md:hidden"
        navClassName="max-w-sm"
      />

      {/* Tablet bottom bar */}
      <BottomNav
        items={tabletNavItems}
        pathname={pathname}
        pillId="tablet-active-pill"
        badgePath="/friends"
        pendingCount={pendingCount}
        wrapperClassName="bottom-3 hidden px-6 md:flex lg:hidden"
        navClassName="max-w-md"
      />
    </MotionConfig>
  );
};