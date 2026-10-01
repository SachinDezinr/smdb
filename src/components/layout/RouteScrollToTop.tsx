import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures that whenever the user navigates between distinct routes,
 * the window starts cleanly at the top (0,0) without persisting or leaking
 * scroll positions from one page onto another.
 *
 * Manual history scroll restoration is disabled so browser cannot randomly
 * jump or offset pages based on unrelated previous locations.
 */
export const RouteScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser automatic scroll restoration to avoid cross-page jumping
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // On distinct page change, reset scroll to top immediately
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
