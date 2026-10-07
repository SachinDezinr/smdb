"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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

const sidebarItems = navSections.flatMap((s) => s.items);

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

/* ------------------------------ one motion language ------------------------------ */

// Every movement (sidebar, tablet bar, phone bar) uses this same spring,
// and every colour/opacity change uses the same 200ms ease-out.
const SPRING = { type: "spring", stiffness: 520, damping: 40, mass: 0.7 } as const;
const COLOR = "transition-colors duration-200 ease-out";

/* ------------------------------ sliding active pill ------------------------------ */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Remembers where each pill was last. Pages render <Navigation /> themselves, so it
// remounts on every route change; this lets the pill still slide from its old spot.
const lastRects: Record<string, Rect | undefined> = {};

/**
 * Measures the active item inside `containerRef` and keeps the rect up to date
 * (route change, resize, bar becoming visible at a breakpoint).
 */
function useActivePill(id: string, activeKey: string | undefined) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const [rect, setRect] = useState<Rect | null>(null);

  const register = useCallback((path: string, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(path, el);
    else itemRefs.current.delete(path);
  }, []);

  const measure = useCallback(() => {
    const el = activeKey ? itemRefs.current.get(activeKey) : undefined;
    // width 0 means this bar is hidden at the current breakpoint
    if (!el || el.offsetWidth === 0) {
      setRect(null);
      return;
    }
    setRect((prev) => {
      const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      return prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
        ? prev
        : next;
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  // Written after commit, so the pill's `initial` still sees the previous position on mount.
  useEffect(() => {
    lastRects[id] = rect ?? undefined;
  }, [id, rect]);

  return { containerRef, register, rect };
}

const toVars = (r: Rect) => ({ x: r.x, y: r.y, width: r.w, height: r.h });

const ActivePill = memo(function ActivePill({
  id,
  rect,
  radius,
}: {
  id: string;
  rect: Rect | null;
  radius: number;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {rect && (
        <motion.div
          key="pill"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bg-primary/15"
          style={{
            borderRadius: radius,
            boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.3)",
          }}
          initial={lastRects[id] ? { ...toVars(lastRects[id]!), opacity: 1 } : { ...toVars(rect), opacity: 0 }}
          animate={{ ...toVars(rect), opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={reduce ? { duration: 0 } : SPRING}
        />
      )}
    </AnimatePresence>
  );
});

/* ------------------------------ sidebar (desktop) ------------------------------ */

const SidebarLink = memo(function SidebarLink({
  item,
  isActive,
  badge,
  register,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  badge?: number;
  register: (path: string, el: HTMLElement | null) => void;
  onNavigate: (path: string) => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      ref={(el) => register(item.path, el)}
      onClick={() => onNavigate(item.path)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold",
        COLOR,
        focusRing,
        isActive ? "text-primary" : "text-muted-foreground hover:bg-white/[0.04] hover:text-white"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={18}
          className={cn(COLOR, isActive ? "text-primary" : "group-hover:text-primary")}
        />
        <span>{item.label}</span>
      </div>

      {badge ? (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white motion-safe:animate-pulse">
          {badge > 99 ? "99+" : badge} new
        </span>
      ) : (
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={cn(
            "text-muted-foreground transition-all duration-200 ease-out",
            isActive
              ? "translate-x-0 opacity-0"
              : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
          )}
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
  register,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  showBadge: boolean;
  register: (path: string, el: HTMLElement | null) => void;
  onNavigate: (path: string) => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      ref={(el) => register(item.path, el)}
      onClick={() => onNavigate(item.path)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex h-11 min-w-0 flex-1 select-none flex-col items-center justify-center rounded-full",
        COLOR,
        focusRing,
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      {/* press feedback lives on the content so it never distorts the sliding pill */}
      <div className="relative flex flex-col items-center gap-0.5 transition-transform duration-150 ease-out group-active:scale-95">
        <div className="relative">
          <Icon size={18} className={COLOR} />
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
            "text-[10px] font-semibold tracking-tight",
            COLOR,
            isActive ? "text-primary" : "text-muted-foreground/80"
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
  activePath,
  pillId,
  badgePath,
  pendingCount,
  wrapperClassName,
  navClassName,
  onNavigate,
}: {
  items: NavItem[];
  activePath: string;
  pillId: string;
  badgePath: string;
  pendingCount: number;
  wrapperClassName: string;
  navClassName: string;
  onNavigate: (path: string) => void;
}) {
  const activeKey = items.find((i) => isPathActive(activePath, i.path))?.path;
  const { containerRef, register, rect } = useActivePill(pillId, activeKey);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 justify-center pb-[env(safe-area-inset-bottom)]",
        wrapperClassName
      )}
    >
      <nav
        ref={containerRef as React.RefObject<HTMLElement>}
        aria-label="Primary"
        className={cn(
          "pointer-events-auto relative flex h-[58px] w-full items-center justify-between gap-1.5 rounded-full border border-white/15 bg-neutral-950/95 px-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-xl",
          navClassName
        )}
      >
        <ActivePill id={pillId} rect={rect} radius={9999} />
        {items.map((item) => (
          <BottomNavLink
            key={item.path}
            item={item}
            register={register}
            onNavigate={onNavigate}
            isActive={item.path === activeKey}
            showBadge={item.path === badgePath && pendingCount > 0}
          />
        ))}
      </nav>
    </div>
  );
});

/* ------------------------------ sidebar nav (pill wrapper) ------------------------------ */

const SidebarNav = memo(function SidebarNav({
  activePath,
  pendingCount,
  onNavigate,
}: {
  activePath: string;
  pendingCount: number;
  onNavigate: (path: string) => void;
}) {
  const activeKey = sidebarItems.find((i) => isPathActive(activePath, i.path))?.path;
  const { containerRef, register, rect } = useActivePill("sidebar", activeKey);

  return (
    <nav
      ref={containerRef as React.RefObject<HTMLElement>}
      aria-label="Primary"
      className="relative space-y-6"
    >
      <ActivePill id="sidebar" rect={rect} radius={12} />
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
                register={register}
                onNavigate={onNavigate}
                isActive={item.path === activeKey}
                badge={item.path === "/friends" ? pendingCount : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
});

/* ------------------------------ component ------------------------------ */

export const Navigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // The pill starts moving on tap instead of waiting for the next page to render.
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const activePath = pendingPath ?? pathname;
  const handleNavigate = useCallback((path: string) => setPendingPath(path), []);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    if (!pendingPath) return;
    // Safety net if a route redirects or is blocked and the path never changes
    const t = setTimeout(() => setPendingPath(null), 1000);
    return () => clearTimeout(t);
  }, [pendingPath]);

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
    <>
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
              <div className="absolute -inset-1 rounded-2xl bg-primary/30 blur-sm transition-colors duration-200 group-hover:bg-primary/50" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-[#FFE799] via-primary to-[#D69E0A] shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
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

          <SidebarNav
            activePath={activePath}
            pendingCount={pendingCount}
            onNavigate={handleNavigate}
          />
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm font-semibold text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300",
                "transition-colors duration-200 ease-out",
                focusRing
              )}
            >
              <LogOut
                size={18}
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              <span>Sign out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-black shadow-md shadow-primary/20 hover:bg-primary/90",
                "transition-colors duration-200 ease-out",
                focusRing
              )}
            >
              <LogIn size={18} />
              <span>Sign in or register</span>
            </Link>
          )}

          <div className="flex items-center justify-between px-1.5 text-[11px] text-muted-foreground/70">
            <Link to="/about" className="transition-colors duration-200 hover:text-white">
              About
            </Link>
            <Link to="/contact" className="transition-colors duration-200 hover:text-white">
              Support
            </Link>
            <span className="text-[10px]">v1.1</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <BottomNav
        items={mobileNavItems}
        activePath={activePath}
        pillId="mobile"
        badgePath="/profile"
        pendingCount={pendingCount}
        onNavigate={handleNavigate}
        wrapperClassName="bottom-2.5 flex px-4 sm:bottom-3 md:hidden"
        navClassName="max-w-sm"
      />

      {/* Tablet bottom bar */}
      <BottomNav
        items={tabletNavItems}
        activePath={activePath}
        pillId="tablet"
        badgePath="/friends"
        pendingCount={pendingCount}
        onNavigate={handleNavigate}
        wrapperClassName="bottom-3 hidden px-6 md:flex lg:hidden"
        navClassName="max-w-md"
      />
    </>
  );
};