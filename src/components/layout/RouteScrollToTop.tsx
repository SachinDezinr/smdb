import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface ScrollPosition {
  x: number;
  y: number;
}

const scrollPositions = new Map<string, ScrollPosition>();

export const RouteScrollToTop = () => {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}`;
  const previousRouteRef = useRef(routeKey);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const previousRoute = previousRouteRef.current;

    if (previousRoute !== routeKey) {
      scrollPositions.set(previousRoute, {
        x: window.scrollX,
        y: window.scrollY,
      });
    }

    previousRouteRef.current = routeKey;

    const savedPosition = scrollPositions.get(routeKey);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          left: savedPosition?.x ?? 0,
          top: savedPosition?.y ?? 0,
          behavior: "instant",
        });
      });
    });
  }, [routeKey]);

  useEffect(() => {
    const savePosition = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = requestAnimationFrame(() => {
        scrollPositions.set(routeKey, {
          x: window.scrollX,
          y: window.scrollY,
        });

        frameRef.current = null;
      });
    };

    window.addEventListener("scroll", savePosition, {
      passive: true,
    });

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      scrollPositions.set(routeKey, {
        x: window.scrollX,
        y: window.scrollY,
      });

      window.removeEventListener("scroll", savePosition);
    };
  }, [routeKey]);

  return null;
};