import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { BADGE_TIERS, type BadgeTier } from "@/lib/badges";

interface BadgeTiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBadge: BadgeTier;
  watchedCount: number;
}

export const BadgeTiersModal = ({
  isOpen,
  onClose,
  currentBadge,
  watchedCount,
}: BadgeTiersModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-ranks-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3
                  id="badge-ranks-title"
                  className="text-lg font-bold text-white flex items-center gap-2"
                >
                  <Sparkles
                    className="text-primary"
                    size={18}
                    aria-hidden="true"
                  />
                  Cinephile Badge Ranks
                </h3>

                <p className="text-xs text-muted-foreground">
                  Unlock higher badges by expanding your watch history.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close badge ranks"
                className="p-2 text-muted-foreground hover:text-white bg-white/5 rounded-full transition-colors"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1">
              {BADGE_TIERS.map((tier) => {
                const isCurrent = currentBadge.label === tier.label;
                const isUnlocked = watchedCount >= tier.min;
                const Icon = tier.icon;

                return (
                  <div
                    key={tier.label}
                    className={[
                      "p-3.5 rounded-2xl border flex items-center justify-between transition-all",
                      isCurrent
                        ? "border-primary/60 bg-primary/10"
                        : isUnlocked
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-white/5 bg-white/[0.01] opacity-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl border ${tier.badgeStyle} flex-shrink-0`}
                      >
                        <Icon
                          size={18}
                          className={tier.iconColor}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {tier.label}
                          </h4>

                          {isCurrent && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary text-black rounded-full">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate">
                          {tier.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="text-xs font-bold text-primary">
                        {tier.max === null
                          ? `${tier.min}+`
                          : `${tier.min} - ${tier.max}`}
                      </span>

                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        titles
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};