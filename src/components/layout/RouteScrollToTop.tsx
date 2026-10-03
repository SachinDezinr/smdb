import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const scrollPositions = new Map();

export const RouteScrollToTop = () => {
  const location = useLocation();
  const { pathname, search } = location;

  // Include query parameters so different filtered pages can have
  // separate scroll positions.
  const routeKey = `${pathname}${search}`;

  const previousRouteRef = useRef(routeKey);

  useEffect(() => {
    // Prevent the browser from restoring its own position.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const previousRoute = previousRouteRef.current;

    // Save the scroll position of the page we are leaving.
    if (previousRoute !== routeKey) {
      scrollPositions.set(previousRoute, {
        x: window.scrollX,
        y: window.scrollY,
      });
    }

    previousRouteRef.current = routeKey;

    // Restore the saved position for the new route.
    const savedPosition = scrollPositions.get(routeKey);

    // Wait until the new page has rendered.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (savedPosition) {
          window.scrollTo({
            left: savedPosition.x,
            top: savedPosition.y,
            behavior: "instant",
          });
        } else {
          // First visit to this route.
          window.scrollTo({
            left: 0,
            top: 0,
            behavior: "instant",
          });
        }
      });
    });
  }, [routeKey]);

  useEffect(() => {
    // Continuously keep the latest position for the current route.
    const handleScroll = () => {
      scrollPositions.set(routeKey, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      // Save one final position before leaving the page/component.
      scrollPositions.set(routeKey, {
        x: window.scrollX,
        y: window.scrollY,
      });

      window.removeEventListener("scroll", handleScroll);
    };
  }, [routeKey]);

  return null;
};