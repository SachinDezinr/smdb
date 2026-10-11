"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
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

/* ------------------------------ data ------------------------------ */

type IconType = React.ComponentType<{ size?: number; className?: string }>;
type NavigateHandler = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => void;
type RegisterFn = (path: string, el: HTMLElement | null) => void;

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

interface BottomItem extends NavItem {
  /** Extra classes for the link, e.g. to hide it at a breakpoint. */
  className?: string;
  /** Where the "new requests" dot shows: on every size, or only where Social is hidden. */
  badge?: "always" | "mobileOnly";
}

// One list for both bars. Mobile (<md) hides Social; tablet (md–lg) shows it.
const bottomNavItems: BottomItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "LineUp", path: "/upcoming" },
  { icon: Sparkles, label: "Picks", path: "/recommendations" },
  { icon: Library, label: "Vault", path: "/collection" },
  { icon: Users, label: "Social", path: "/friends", className: "hidden md:flex", badge: "always" },
  { icon: User, label: "Profile", path: "/profile", badge: "mobileOnly" },
];

/** "/" only matches itself; other routes also match their children (/collection/123). */
const isPathActive = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

const findActiveKey = (items: NavItem[], pathname: string) =>
  items.find((i) => isPathActive(pathname, i.path))?.path;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

const PILL_TRANSITION =
  "transform 300ms cubic-bezier(0.22, 1, 0.37, 1), opacity 150ms ease-out";
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
 * Moves the pill straight in the DOM. No React state, so a route change or a resize
 * never re-renders anything just to reposition a div, and the transform transition
 * stays on the compositor.
 */
function useActivePill(id: string, activeKey: string | undefined) {
  const containerRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const placed = useRef(false);

  const register = useCallback<RegisterFn>((path, el) => {
    if (el) itemRefs.current.set(path, el);
    else itemRefs.current.delete(path);
  }, []);

  const place = useCallback(
    (animate: boolean) => {
      const pill = pillRef.current;
      if (!pill) return;

      const item = activeKey ? itemRefs.current.get(activeKey) : undefined;
      // width 0 means this bar is hidden at the current breakpoint
      if (!item || item.offsetWidth === 0) {
        pill.style.opacity = "0";
        lastRects[id] = undefined;
        return;
      }

      const next: Rect = {
        x: item.offsetLeft,
        y: item.offsetTop,
        w: item.offsetWidth,
        h: item.offsetHeight,
      };
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const set = (r: Rect, withTransition: boolean) => {
        pill.style.transition = withTransition && !reduce ? PILL_TRANSITION : "none";
        pill.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
        pill.style.width = `${r.w}px`;
        pill.style.height = `${r.h}px`;
      };

      if (!placed.current) {
        placed.current = true;
        const from = lastRects[id];
        if (from && (from.x !== next.x || from.y !== next.y)) {
          // remounted by a route change: start where the previous pill ended, then slide
          set(from, false);
          void pill.offsetWidth; // flush so the browser sees the starting position
          set(next, true);
        } else {
          set(next, false);
        }
      } else {
        set(next, animate);
      }

      pill.style.opacity = "1";
      lastRects[id] = next;
    },
    [id, activeKey]
  );

  // Route change: slide.
  useLayoutEffect(() => {
    place(true);
  }, [place]);

  // Container resized (or the bar became visible at a breakpoint): snap, don't slide.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let w = container.offsetWidth;
    let h = container.offsetHeight;
    const ro = new ResizeObserver(() => {
      // ResizeObserver always fires once on observe(); ignore it unless the size really changed
      if (container.offsetWidth === w && container.offsetHeight === h) return;
      w = container.offsetWidth;
      h = container.offsetHeight;
      place(false);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [place]);

  return { containerRef, pillRef, register };
}

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
  register: RegisterFn;
  onNavigate: NavigateHandler;
}) {
  const Icon = item.icon;
  const { path } = item;

  // Stable callback ref: an inline arrow would be detached and re-attached on every render.
  const setRef = useCallback((el: HTMLAnchorElement | null) => register(path, el), [register, path]);

  return (
    <Link
      to={path}
      ref={setRef}
      onClick={(e) => onNavigate(e, path)}
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
            "text-muted-foreground transition-[transform,opacity] duration-200 ease-out",
            isActive
              ? "translate-x-0 opacity-0"
              : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
          )}
        />
      )}
    </Link>
  );
});

const SidebarNav = memo(function SidebarNav({
  activePath,
  pendingCount,
  onNavigate,
}: {
  activePath: string;
  pendingCount: number;
  onNavigate: NavigateHandler;
}) {
  const activeKey = findActiveKey(sidebarItems, activePath);
  const { containerRef, pillRef, register } = useActivePill("sidebar", activeKey);

  return (
    <nav ref={containerRef} aria-label="Primary" className="relative space-y-6">
      <div
        ref={pillRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 rounded-xl bg-primary/15 opacity-0 ring-1 ring-inset ring-primary/30 will-change-transform"
      />
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

/* ------------------------------ bottom bar (mobile + tablet) ------------------------------ */

const BottomNavLink = memo(function BottomNavLink({
  item,
  isActive,
  showBadge,
  onNavigate,
}: {
  item: BottomItem;
  isActive: boolean;
  showBadge: boolean;
  onNavigate: NavigateHandler;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={(e) => onNavigate(e, item.path)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex h-11 min-w-0 flex-1 select-none flex-col items-center justify-center rounded-full",
        "transition-colors duration-150 ease-out",
        focusRing,
        isActive ? "text-primary" : "text-muted-foreground",
        item.className
      )}
    >
      {/* Simple fade: every item owns its highlight, no travelling pill to wait for */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/30",
          "transition-opacity duration-150 ease-out",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />

      <div className="relative flex flex-col items-center gap-0.5 transition-transform duration-100 ease-out group-active:scale-95">
        <div className="relative">
          <Icon size={18} />
          {showBadge && (
            <span className={item.badge === "mobileOnly" ? "md:hidden" : undefined}>
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full border-2 border-neutral-950 bg-red-500"
              />
              <span className="sr-only">New requests</span>
            </span>
          )}
        </div>

        <span
          className={cn(
            "text-[10px] font-semibold tracking-tight transition-colors duration-150 ease-out",
            isActive ? "text-primary" : "text-muted-foreground/80"
          )}
        >
          {item.label}
        </span>
      </div>
    </Link>
  );
});

// One bar for mobile and tablet instead of two hidden/shown copies of the same DOM.
const BottomNav = memo(function BottomNav({
  activePath,
  pendingCount,
  onNavigate,
}: {
  activePath: string;
  pendingCount: number;
  onNavigate: NavigateHandler;
}) {
  const activeKey = findActiveKey(bottomNavItems, activePath);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2.5 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-3 md:px-6 lg:hidden">
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex h-[58px] w-full max-w-sm items-center justify-between gap-1.5 rounded-full border border-white/15 bg-black px-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.85)] ring-1 ring-white/10 md:max-w-md"
      >
        {bottomNavItems.map((item) => (
          <BottomNavLink
            key={item.path}
            item={item}
            onNavigate={onNavigate}
            isActive={item.path === activeKey}
            showBadge={!!item.badge && pendingCount > 0}
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

  // The pill starts moving on tap instead of waiting for the next page to render.
  // isPending stays true until the transition commits (or is abandoned), so there is no
  // reset effect and no timeout safety net to maintain.
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const activePath = isPending && pendingPath ? pendingPath : pathname;

  const handleNavigate = useCallback<NavigateHandler>(
    (e, path) => {
      const plainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
      if (!plainClick) return; // let the browser open new tabs/windows as usual

      e.preventDefault();
      setPendingPath(path); // urgent: the pill starts sliding right away
      // Low priority: the heavy page render can't hold up the pill or the tap feedback,
      // and the old page stays on screen until the next one is ready.
      startTransition(() => navigate(path));
    },
    [navigate, startTransition]
  );

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
    let lastUserId: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      const user = session?.user;
      setIsAuthenticated(!!user);
      setCachedAuthState(!!user);

      if (!user) {
        lastUserId = null;
        setPendingCount(0);
        return;
      }

      const sameUser = user.id === lastUserId;
      lastUserId = user.id;

      // A silent token refresh doesn't change the profile. Supabase also re-emits
      // SIGNED_IN when the tab regains focus; for the same user that's a no-op too.
      if (event === "TOKEN_REFRESHED" || (event === "SIGNED_IN" && sameUser)) return;

      // Defer: awaiting Supabase calls inside this callback can deadlock the auth client.
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const data = await fetchProfileData(event !== "INITIAL_SESSION");
          if (isMounted && data) setPendingCount(data.pendingCount);
        } catch (error) {
          console.error("Profile refresh failed:", error);
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
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
      <aside className="sticky top-0 z-40 hidden h-screen w-72 select-none flex-col justify-between border-r border-white/10 bg-neutral-950/80 px-5 py-6 lg:flex">
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
                COLOR,
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
                COLOR,
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

      {/* Mobile + tablet bottom bar */}
      <BottomNav
        activePath={activePath}
        pendingCount={pendingCount}
        onNavigate={handleNavigate}
      />
    </>
  );
};