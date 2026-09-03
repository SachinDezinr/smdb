"use client";

import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();

export const ScrollRestorationHandler = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const prevKeyRef = useRef<string>(location.key);

  // Set browser scroll restoration to manual so our component controls smooth, accurate restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Save scroll position for the current location continuously and upon leaving
  useEffect(() => {
    const recordScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      scrollPositions.set(location.key, y);
      scrollPositions.set(location.pathname, y);
      try {
        sessionStorage.setItem(`scroll_${location.key}`, String(y));
        sessionStorage.setItem(`scroll_${location.pathname}`, String(y));
      } catch {
        // ignore storage errors
      }
    };

    window.addEventListener("scroll", recordScroll, { passive: true });
    return () => {
      recordScroll();
      window.removeEventListener("scroll", recordScroll);
    };
  }, [location.key, location.pathname]);

  // Handle route transitions
  useEffect(() => {
    if (navType === "POP") {
      // User pressed back or forward button: restore previous scroll position
      const savedY =
        scrollPositions.get(location.key) ??
        scrollPositions.get(location.pathname) ??
        Number(sessionStorage.getItem(`scroll_${location.key}`)) ??
        Number(sessionStorage.getItem(`scroll_${location.pathname}`)) ??
        0;

      // Restore immediately and schedule follow-ups in case DOM elements are hydrating
      window.scrollTo(0, savedY);

      const rafId = requestAnimationFrame(() => {
        window.scrollTo(0, savedY);
      });

      const timerId = setTimeout(() => {
        window.scrollTo(0, savedY);
      }, 50);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timerId);
      };
    } else if (navType === "PUSH") {
      // User clicked a brand new link to navigate forward: start fresh from top
      window.scrollTo(0, 0);
    }

    prevKeyRef.current = location.key;
  }, [location.key, location.pathname, navType]);

  return null;
};