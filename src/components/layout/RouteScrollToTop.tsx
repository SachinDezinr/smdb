import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Lives for this browser tab's SPA session - a full page reload clears it,
// same as a fresh visit would.
const scrollPositions = new Map<string, number>();

/**
 * Keeps each route's scroll position independent: leaving a page saves
 * where you were, and returning to that same page later (via a nav link,
 * a "back" link, or the browser's own back/forward buttons) restores it
 * instead of dropping you back at the top. A route visited for the first
 * time still starts at the top, same as before.
 */
export const RouteScrollToTop = () => {
  const location = useLocation();
  const key = location.pathname + location.search;
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    // Disable the browser's own scroll restoration - we're handling it
    // ourselves below, and letting both run at once causes fighting/jumps.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Save the position of the page we're leaving before switching over.
    if (previousKey.current !== null) {
      scrollPositions.set(previousKey.current, window.scrollY);
    }
    previousKey.current = key;

    const savedPosition = scrollPositions.get(key);

    // Deferred a frame so the new page's content has laid out first -
    // restoring immediately on a still-empty/loading page can land short
    // of the real target position. Very slow-loading async content (a
    // list still fetching, say) may still not land perfectly - that's an
    // inherent limit of restoring scroll before the content it's
    // measured against has actually finished growing.
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, savedPosition ?? 0);
    });

    return () => cancelAnimationFrame(frame);
  }, [key]);

  return null;
};