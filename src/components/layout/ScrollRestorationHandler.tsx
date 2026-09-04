"use client";

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Global map keyed by normalized route pathname (and optional query string)
const scrollPositions = new Map<string, number>();

export const ScrollRestorationHandler = () => {
  const location = useLocation();
  const currentPathKey = location.pathname + location.search;
  const prevPathKeyRef = useRef<string>(currentPathKey);

  // Set browser native scroll restoration to manual so we control exact coordinate restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Continuously record scroll position for the current path
  useEffect(() => {
    const saveCurrentScroll = () => {
      const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      scrollPositions.set(currentPathKey, y);
      try {
        sessionStorage.setItem(`smdb_scroll_${currentPathKey}`, String(y));
      } catch {
        // ignore storage quota errors
      }
    };

    window.addEventListener("scroll", saveCurrentScroll, { passive: true });
    window.addEventListener("beforeunload", saveCurrentScroll);

    return () => {
      saveCurrentScroll();
      window.removeEventListener("scroll", saveCurrentScroll);
      window.removeEventListener("beforeunload", saveCurrentScroll);
    };
  }, [currentPathKey]);

  // When route changes, restore previous scroll if user was already here, or smooth restore
  useEffect(() => {
    // If the path actually changed:
    if (prevPathKeyRef.current !== currentPathKey) {
      // Save scroll of previous path one last time
      const prevY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      scrollPositions.set(prevPathKeyRef.current, prevY);

      // Target position for the incoming route
      let targetY = scrollPositions.get(currentPathKey);

      if (targetY === undefined) {
        const stored = sessionStorage.getItem(`smdb_scroll_${currentPathKey}`);
        if (stored !== null) {
          targetY = Number(stored);
        }
      }

      if (targetY !== undefined && targetY > 0) {
        const y = targetY;
        // Schedule multiple passes to ensure async/rendered lists and images don't collapse scroll
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

        const raf1 = requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        });

        const timer1 = setTimeout(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        }, 60);

        const timer2 = setTimeout(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        }, 220);

        prevPathKeyRef.current = currentPathKey;

        return () => {
          cancelAnimationFrame(raf1);
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }

      prevPathKeyRef.current = currentPathKey;
    }
  }, [currentPathKey]);

  return null;
};
