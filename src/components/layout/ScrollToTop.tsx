import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";

const VISIBILITY_THRESHOLD = 300;

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = requestAnimationFrame(() => {
        setIsVisible(window.scrollY > VISIBILITY_THRESHOLD);
        frameRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-20 lg:bottom-10 right-6 z-50 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-primary shadow-2xl hover:bg-primary hover:text-black transition-all group"
        >
          <ChevronUp
            size={24}
            aria-hidden="true"
            className="group-hover:-translate-y-1 transition-transform"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};