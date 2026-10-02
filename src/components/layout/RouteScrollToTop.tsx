import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Last known scroll position per route. Lives for this tab's session - a
// full page reload clears it, same as a fresh visit would.
const scrollPositions = new Map<string, number>();

// How long we keep waiting for a page to grow tall enough before giving up.
const RESTORE_TIMEOUT_MS = 5000;

// Any of these means the user took over, so we stop moving the page for them.
const USER_INPUT_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

/**
 * Scrolls to `target` as soon as the page is tall enough to reach it.
 * Pages that load data are short at first (spinner / empty list), so a single
 * scrollTo right after navigating gets clamped and lands in the wrong place.
 * Returns a function that cancels the restore.
 */
function restoreScroll(target: number, onSettled: () => void): () => void {
  const root = document.documentElement;
  const cleanups: Array<() => void> = [];
  let settled = false;

  const settle = () => {
    if (settled) return;
    settled = true;
    cleanups.forEach((cleanup) => cleanup());
    onSettled();
  };

  // 1px tolerance: scrollHeight is rounded, scrollY can be fractional.
  const tryRestore = (): boolean => {
    if (root.scrollHeight - root.clientHeight >= target - 1) {
      window.scrollTo({ top: target, behavior: "instant" });
      settle();
      return true;
    }
    return false;
  };

  // Cached pages render instantly, so this usually succeeds right away.
  if (tryRestore()) return settle;

  // ResizeObserver callbacks run after layout but before paint, so the jump
  // happens in the same frame the content appears - no flash of the top.
  const observer = new ResizeObserver(tryRestore);
  observer.observe(document.body);
  observer.observe(root);
  cleanups.push(() => observer.disconnect());

  // Safety net for layouts where neither element's own size changes.
  const poll = window.setInterval(tryRestore, 150);
  cleanups.push(() => window.clearInterval(poll));

  // Give up eventually: go as far as the page allows.
  const giveUp = window.setTimeout(() => {
    window.scrollTo({ top: target, behavior: "instant" });
    settle();
  }, RESTORE_TIMEOUT_MS);
  cleanups.push(() => window.clearTimeout(giveUp));

  const controller = new AbortController();
  USER_INPUT_EVENTS.forEach((type) =>
    window.addEventListener(type, settle, { passive: true, signal: controller.signal })
  );
  cleanups.push(() => controller.abort());

  return settle;
}

/**
 * Per-route scroll memory: leaving a page remembers where you were, and
 * coming back (nav link, back button, forward button) puts you there again.
 * A route you've never visited starts at the top.
 */
export const RouteScrollToTop = () => {
  const { pathname, search } = useLocation();
  const key = pathname + search;

  // Which page the scroll listener below is currently recording for.
  const activeKey = useRef(key);
  // True while we're moving the page ourselves. Those scrolls (and the
  // browser clamping the position on a still-short page) must not be
  // recorded as if the user had scrolled there.
  const isRestoring = useRef(false);

  useEffect(() => {
    // We handle restoration ourselves; letting the browser do it too makes
    // the two fight and jump.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Record the position continuously while the user is ON a page. The old
    // version only read it after the next page had already replaced the DOM,
    // by which point the browser had often already squashed the scroll
    // position on the shorter page - so it saved 0 or a too-small value.
    const record = () => {
      if (!isRestoring.current) {
        scrollPositions.set(activeKey.current, window.scrollY);
      }
    };
    window.addEventListener("scroll", record, { passive: true });
    return () => window.removeEventListener("scroll", record);
  }, []);

  // Layout effect: runs right after the new page is in the DOM and before
  // the browser lays it out, so no scroll event can sneak in under the wrong key.
  useLayoutEffect(() => {
    activeKey.current = key;
    const target = scrollPositions.get(key) ?? 0;

    window.scrollTo({ top: 0, behavior: "instant" });
    if (target <= 0) return undefined;

    isRestoring.current = true;
    return restoreScroll(target, () => {
      isRestoring.current = false;
    });
  }, [key]);

  return null;
};