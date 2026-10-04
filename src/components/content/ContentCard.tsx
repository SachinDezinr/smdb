import {
  memo,
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
} from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Check,
  Plus,
  Film,
  User,
  Users,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  ContentItem,
  fetchCredits,
  fetchTvSeasons,
  getCachedTvSeason,
  getSeasonDisplayText,
  isSeriesMediaType,
} from "@/lib/tmdb";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ContentCardProps {
  item: ContentItem;
  isWatched?: boolean;
  onToggleWatched?: (id: number) => void;
  showReleaseDate?: boolean;
  showCategory?: boolean;
}

interface Credits {
  director?: string;
  cast?: string[];
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const CATEGORY_LABELS: Record<
  ContentItem["media_type"],
  string
> = {
  movie: "Movie",
  tv: "Series",
  anime: "Anime",
  "k-drama": "K-Drama",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * TMDB date strings are calendar dates rather than timestamps.
 * Using UTC getters prevents dates such as 2026-01-01 from becoming
 * 31 Dec 2025 in time zones west of UTC.
 */
const formatDate = (
  dateString: string,
): string => {
  if (
    !dateString ||
    dateString === "TBA"
  ) {
    return "TBA";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "TBA";
  }

  return `${date.getUTCDate()} ${
    MONTHS[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`;
};

const getReleaseYear = (
  dateString: string,
): string => {
  if (
    !dateString ||
    dateString === "TBA"
  ) {
    return "";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return String(
    date.getUTCFullYear(),
  );
};

const getLocalToday = (): string => {
  const date = new Date();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

const isFutureRelease = (
  releaseDate: string,
): boolean => {
  if (
    !releaseDate ||
    releaseDate === "TBA"
  ) {
    return false;
  }

  return (
    releaseDate >
    getLocalToday()
  );
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export const ContentCard = memo(
  function ContentCard({
    item,
    isWatched = false,
    onToggleWatched,
    showReleaseDate = false,
    showCategory = false,
  }: ContentCardProps) {
    const isSeries =
      isSeriesMediaType(
        item.media_type,
      );

    const isFuture =
      isFutureRelease(
        item.release_date,
      );

    const shouldShowCredits =
      showReleaseDate ||
      isFuture;

    const canToggleWatched =
      !shouldShowCredits &&
      Boolean(onToggleWatched);

    /* ---------------------------------------------------------------------- */
    /* Local state                                                            */
    /* ---------------------------------------------------------------------- */

    const [
      showCredits,
      setShowCredits,
    ] = useState(false);

    const [
      showOverlay,
      setShowOverlay,
    ] = useState(false);

    const [
      credits,
      setCredits,
    ] = useState<Credits | null>(
      null,
    );

    const [
      loadingCredits,
      setLoadingCredits,
    ] = useState(false);

    const [
      seasons,
      setSeasons,
    ] = useState<
      number | undefined
    >(() => {
      if (!isSeries) {
        return undefined;
      }

      return (
        item.season_count ??
        getCachedTvSeason(item.id)
      );
    });

    /* ---------------------------------------------------------------------- */
    /* Season count                                                           */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
      if (!isSeries) {
        return;
      }

      const knownSeasonCount =
        item.season_count ??
        getCachedTvSeason(item.id);

      if (
        typeof knownSeasonCount ===
          "number" &&
        knownSeasonCount > 0
      ) {
        setSeasons(
          knownSeasonCount,
        );
        return;
      }

      let active = true;

      void fetchTvSeasons(item.id)
        .then((count) => {
          if (
            !active ||
            typeof count !==
              "number"
          ) {
            return;
          }

          setSeasons(count);
        })
        .catch(() => {
          /*
           * Season count is supplementary
           * information. The card remains
           * usable if this request fails.
           */
        });

      return () => {
        active = false;
      };
    }, [
      isSeries,
      item.id,
      item.season_count,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Derived display values                                                 */
    /* ---------------------------------------------------------------------- */

    const seasonText =
      isSeries
        ? getSeasonDisplayText(
            seasons,
          )
        : "";

    const categoryLabel =
      CATEGORY_LABELS[
        item.media_type
      ] ?? item.media_type;

    const hasPoster =
      Boolean(item.poster_path);

    const hasRating =
      item.vote_average > 0;

    const releaseYear =
      getReleaseYear(
        item.release_date,
      );

    /* ---------------------------------------------------------------------- */
    /* Credits                                                                */
    /* ---------------------------------------------------------------------- */

    const loadCredits =
      useCallback(async () => {
        if (credits) {
          return;
        }

        setLoadingCredits(true);

        try {
          const result =
            await fetchCredits(
              item.id,
              item.media_type ===
                "movie"
                ? "movie"
                : "tv",
            );

          setCredits(result);
        } catch (error) {
          console.error(
            "[ContentCard] Failed to fetch credits:",
            error,
          );
        } finally {
          setLoadingCredits(
            false,
          );
        }
      }, [
        credits,
        item.id,
        item.media_type,
      ]);

    /* ---------------------------------------------------------------------- */
    /* Poster interaction                                                     */
    /* ---------------------------------------------------------------------- */

    const handlePosterClick =
      useCallback(
        async (
          event: MouseEvent<HTMLDivElement>,
        ) => {
          /*
           * Upcoming/future cards use poster
           * interaction to show credits.
           */
          if (
            shouldShowCredits
          ) {
            if (showCredits) {
              setShowCredits(
                false,
              );
              return;
            }

            await loadCredits();
            setShowCredits(true);
            return;
          }

          if (
            !onToggleWatched
          ) {
            return;
          }

          const rect =
            event.currentTarget.getBoundingClientRect();

          if (
            rect.height <= 0
          ) {
            return;
          }

          const clickPosition =
            (event.clientY -
              rect.top) /
            rect.height;

          /*
           * Center area:
           * directly toggle collection.
           *
           * Top/bottom:
           * reveal the action overlay.
           */
          const isCenterClick =
            clickPosition >=
              0.28 &&
            clickPosition <=
              0.72;

          if (
            isCenterClick
          ) {
            onToggleWatched(
              item.id,
            );
            return;
          }

          setShowOverlay(
            (visible) =>
              !visible,
          );
        },
        [
          item.id,
          loadCredits,
          onToggleWatched,
          shouldShowCredits,
          showCredits,
        ],
      );

    const handleActionClick =
      useCallback(
        (
          event: MouseEvent<HTMLButtonElement>,
        ) => {
          event.stopPropagation();

          onToggleWatched?.(
            item.id,
          );
        },
        [
          item.id,
          onToggleWatched,
        ],
      );

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        whileHover={{
          scale: 1.02,
        }}
        className="group relative flex w-full flex-col gap-2.5"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Poster                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div
          onClick={
            handlePosterClick
          }
          role="button"
          tabIndex={0}
          aria-label={
            shouldShowCredits
              ? `Show credits for ${item.title}`
              : onToggleWatched
                ? `${
                    isWatched
                      ? "Remove"
                      : "Add"
                  } ${item.title} ${
                    isWatched
                      ? "from"
                      : "to"
                  } collection`
                : item.title
          }
          onKeyDown={(event) => {
            if (
              event.key ===
                "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();

              void handlePosterClick(
                event as unknown as MouseEvent<HTMLDivElement>,
              );
            }
          }}
          className={cn(
            "relative aspect-[2/3] cursor-pointer select-none overflow-hidden rounded-2xl bg-neutral-900 shadow-lg transition-[border-color,border-width,box-shadow] duration-300",
            isWatched
              ? "border-[2px] border-primary ring-2 ring-primary/50 cinematic-glow"
              : "border border-white/10 group-hover:border-white/25",
          )}
        >
          {hasPoster ? (
            <img
              src={item.poster_path}
              alt={item.title}
              className={cn(
                "pointer-events-none h-full w-full object-cover transition-[filter,transform,opacity] duration-500",
                showCredits ||
                  showOverlay
                  ? "scale-105 blur-sm opacity-60"
                  : "group-hover:scale-105",
                isWatched &&
                  "brightness-[0.92]",
              )}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary/10 p-5 text-center",
                (showCredits ||
                  showOverlay) &&
                  "blur-md opacity-30",
              )}
            >
              <Film
                className="mb-3 text-primary/30"
                size={40}
                strokeWidth={1.5}
                aria-hidden="true"
              />

              <span className="line-clamp-3 text-xs font-semibold leading-snug tracking-tight text-white/90">
                {item.title}

                {seasonText && (
                  <span className="ml-1 text-[11px] font-medium text-white/70">
                    {seasonText}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Category                                                        */}
          {/* -------------------------------------------------------------- */}

          {showCategory && (
            <div className="absolute left-2.5 top-2.5 z-20">
              <span className="rounded-lg border border-primary/20 bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary shadow-md backdrop-blur-md">
                {categoryLabel}
              </span>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Watched badge                                                   */}
          {/* -------------------------------------------------------------- */}

          {isWatched && (
            <motion.div
              initial={{
                scale: 0.5,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className="absolute right-2.5 top-2.5 z-20 rounded-full bg-primary p-1.5 font-bold text-black shadow-lg"
            >
              <CheckCircle2
                size={16}
                aria-hidden="true"
              />
            </motion.div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Collection action overlay                                      */}
          {/* -------------------------------------------------------------- */}

          {canToggleWatched && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-3 opacity-0 transition-opacity duration-200 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100",
                showOverlay &&
                  "pointer-events-auto bg-black/40 opacity-100 backdrop-blur-xs",
              )}
            >
              <button
                type="button"
                onClick={
                  handleActionClick
                }
                aria-label={
                  isWatched
                    ? `Remove ${item.title} from collection`
                    : `Add ${item.title} to collection`
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-xl transition active:scale-95",
                  isWatched
                    ? "border-primary bg-primary text-black hover:bg-primary/90"
                    : "border-primary/40 bg-black/85 text-primary backdrop-blur-md hover:border-primary hover:bg-primary hover:text-black",
                )}
              >
                {isWatched ? (
                  <>
                    <Check
                      size={14}
                      aria-hidden="true"
                    />
                    <span>
                      Watched
                    </span>
                  </>
                ) : (
                  <>
                    <Plus
                      size={14}
                      aria-hidden="true"
                    />
                    <span>
                      Add to Collection
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Credits                                                         */}
          {/* -------------------------------------------------------------- */}

          <AnimatePresence>
            {showCredits && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="absolute inset-0 z-30 flex flex-col justify-center gap-3.5 bg-black/80 p-4 backdrop-blur-md"
              >
                {loadingCredits ? (
                  <div className="flex justify-center">
                    <Loader2
                      className="animate-spin text-primary"
                      size={24}
                      aria-label="Loading credits"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        <User
                          size={11}
                          aria-hidden="true"
                        />
                        Director
                      </p>

                      <p className="truncate text-xs font-semibold text-white drop-shadow-md">
                        {credits?.director ||
                          "Unknown"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        <Users
                          size={11}
                          aria-hidden="true"
                        />
                        Main Cast
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {credits?.cast
                          ?.length ? (
                          credits.cast.map(
                            (
                              name,
                              index,
                            ) => (
                              <span
                                key={`${name}-${index}`}
                                className="max-w-full truncate rounded-md border border-white/10 bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
                              >
                                {name}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="text-[11px] text-white/60">
                            N/A
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Metadata                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex flex-col gap-1 px-0.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight tracking-tight text-white/95 transition-colors group-hover:text-primary md:text-base">
            {item.title}

            {seasonText && (
              <span className="ml-1 inline-block whitespace-nowrap text-xs font-medium text-white/70 md:text-sm">
                {seasonText}
              </span>
            )}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {shouldShowCredits ? (
              <p className="truncate text-[11px] font-medium">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/90">
                  Release:
                </span>{" "}
                {formatDate(
                  item.release_date,
                )}
              </p>
            ) : (
              <div className="flex items-center gap-1.5 font-medium">
                <span
                  className="text-xs font-bold text-primary"
                  aria-hidden="true"
                >
                  ★
                </span>

                <span className="text-xs font-semibold text-white/90">
                  {hasRating
                    ? item.vote_average.toFixed(
                        1,
                      )
                    : "N/A"}
                </span>
              </div>
            )}

            {item.release_date &&
              !shouldShowCredits &&
              releaseYear && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {releaseYear}
                </span>
              )}
          </div>
        </div>
      </motion.div>
    );
  },
);

ContentCard.displayName =
  "ContentCard";