import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface ScrollPosition {
  x: number;
  y: number;
}

const MAX_SAVED_ROUTES = 100;
const RESTORE_TIMEOUT_MS = 1500;
const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

const scrollPositions = new Map<string, ScrollPosition>();

const savePosition = (key: string, { x, y }: ScrollPosition) => {
  scrollPositions.delete(key); // re-insert so the most recent route is always last
  scrollPositions.set(key, { x, y });
  if (scrollPositions.size > MAX_SAVED_ROUTES) {
    scrollPositions.delete(scrollPositions.keys().next().value as string); // drop the oldest
  }
};

export const RouteScrollToTop = () => {
  const { pathname, search } = useLocation();

  // Include query parameters so different filtered pages keep separate scroll positions.
  const routeKey = `${pathname}${search}`;

  // Latest known scroll position of the current route. The scroll listener only writes
  // two numbers into it (no allocation); it is read when the route changes.
  const position = useRef<ScrollPosition>({ x: 0, y: 0 });
  const previousKey = useRef(routeKey);
  const restoring = useRef(false);

  useEffect(() => {
    // Prevent the browser from restoring its own position.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onScroll = () => {
      if (restoring.current) return; // ignore scrolls caused by our own restore
      position.current.x = window.scrollX;
      position.current.y = window.scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    // Save the page we are leaving using the last position the scroll listener reported.
    // Reading window.scrollY here would be too late: the new page (or a loading fallback)
    // is already in the DOM, and the browser may have clamped the scroll position.
    if (previousKey.current !== routeKey) {
      savePosition(previousKey.current, position.current);
      previousKey.current = routeKey;
    }

    // Saved position for this route, or the top on a first visit.
    const target = scrollPositions.get(routeKey) ?? { x: 0, y: 0 };
    position.current = { x: target.x, y: target.y };
    restoring.current = true;

    const startedAt = performance.now();
    let frame = 0;

    const stop = () => {
      cancelAnimationFrame(frame);
      USER_SCROLL_EVENTS.forEach((event) => window.removeEventListener(event, onUserScroll));
    };

    // Finished (or interrupted): go back to tracking the real position.
    const settle = () => {
      stop();
      restoring.current = false;
      position.current = { x: window.scrollX, y: window.scrollY };
    };

    function onUserScroll() {
      settle();
    }

    // Keep trying until the page is tall enough to reach the target (content may still be
    // loading). Give up after a moment, or as soon as the user starts scrolling.
    const attempt = () => {
      window.scrollTo({ left: target.x, top: target.y, behavior: "instant" });

      const reached =
        Math.abs(window.scrollX - target.x) < 2 && Math.abs(window.scrollY - target.y) < 2;

      if (reached || performance.now() - startedAt > RESTORE_TIMEOUT_MS) {
        settle();
      } else {
        frame = requestAnimationFrame(attempt);
      }
    };

    attempt(); // first try runs before paint, so there is no flash at the old scroll offset

    if (restoring.current) {
      USER_SCROLL_EVENTS.forEach((event) =>
        window.addEventListener(event, onUserScroll, { passive: true })
      );
    }

    return () => {
      stop();
      restoring.current = false;
    };
  }, [routeKey]);

  return null;
};