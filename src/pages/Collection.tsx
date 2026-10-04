import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronUp,
  Film,
  Heart,
  Library,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Tv,
} from "lucide-react";

import { Navigation } from "@/components/layout/Navigation";
import { ContentCard } from "@/components/content/ContentCard";

import {
  ContentItem,
  MediaType,
} from "@/lib/tmdb";

import {
  fetchUserCollection,
  getCachedCollection,
  removeCollectionItem,
} from "@/lib/collectionStore";

import {
  getCatalogState,
  setCatalogState,
} from "@/lib/catalogStore";

import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface WatchedContentRow {
  content_id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  media_type: MediaType;
  season_count?: number | null;
  created_at?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 12;

const MEDIA_TYPES: MediaType[] = [
  "movie",
  "tv",
  "anime",
  "k-drama",
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isWatchedContentRow = (
  value: unknown,
): value is WatchedContentRow => {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const row =
    value as Partial<WatchedContentRow>;

  return (
    typeof row.content_id ===
      "number" &&
    typeof row.title ===
      "string" &&
    typeof row.poster_path ===
      "string" &&
    typeof row.release_date ===
      "string" &&
    typeof row.vote_average ===
      "number" &&
    typeof row.media_type ===
      "string" &&
    MEDIA_TYPES.includes(
      row.media_type as MediaType,
    )
  );
};

const normalizeCollection =
  (
    items: unknown,
  ): WatchedContentRow[] => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.filter(
      isWatchedContentRow,
    );
  };

const getReleaseYear = (
  releaseDate: string,
): number | null => {
  if (
    !releaseDate ||
    releaseDate === "TBA"
  ) {
    return null;
  }

  const date =
    new Date(releaseDate);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  /*
   * TMDB release_date is a calendar
   * date. UTC avoids timezone shifting.
   */
  return date.getUTCFullYear();
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const Collection = () => {
  const navigate =
    useNavigate();

  /*
   * Read the in-memory collection only
   * once for the initial render.
   */
  const initialCollection =
    useMemo(
      () =>
        normalizeCollection(
          getCachedCollection(),
        ),
      [],
    );

  const [
    watchedItems,
    setWatchedItems,
  ] = useState<
    WatchedContentRow[]
  >(initialCollection);

  const [
    loading,
    setLoading,
  ] = useState(
    initialCollection.length ===
      0 &&
      getCachedCollection() ===
        null,
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    visibleCount,
    setVisibleCount,
  ] = useState(PAGE_SIZE);

  const [
    showScrollTop,
    setShowScrollTop,
  ] = useState(false);

  const [
    activeTab,
    setActiveTab,
  ] = useState("all");

  const currentYear =
    new Date().getFullYear();

  /* ------------------------------------------------------------------------ */
  /* Load collection                                                          */
  /* ------------------------------------------------------------------------ */

  const loadData =
    useCallback(
      async () => {
        /*
         * Keep cached data visible while
         * refreshing so the page doesn't
         * flash an empty/loading state.
         */
        if (
          watchedItems.length ===
          0
        ) {
          setLoading(true);
        }

        try {
          const result =
            await fetchUserCollection(
              true,
            );

          setWatchedItems(
            normalizeCollection(
              result,
            ),
          );
        } catch (error) {
          console.error(
            "[Collection] Failed to load collection:",
            error,
          );
        } finally {
          setLoading(false);
        }
      },
      [watchedItems.length],
    );

  /* ------------------------------------------------------------------------ */
  /* Authentication + initial load                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const initialize =
      async () => {
        const {
          data: { user },
          error,
        } =
          await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "[Collection] Failed to read user:",
            error.message,
          );
        }

        if (!user) {
          navigate(
            "/login",
            {
              replace: true,
            },
          );

          return;
        }

        await loadData();
      };

    void initialize();

    return () => {
      mounted = false;
    };
  }, [loadData, navigate]);

  /* ------------------------------------------------------------------------ */
  /* Scroll-to-top                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let ticking = false;

    const handleScroll =
      () => {
        if (ticking) {
          return;
        }

        ticking = true;

        window.requestAnimationFrame(
          () => {
            setShowScrollTop(
              window.scrollY > 400,
            );

            ticking = false;
          },
        );
      };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Remove watched item                                                      */
  /* ------------------------------------------------------------------------ */

  const removeWatched =
    useCallback(
      async (
        contentId: number,
      ) => {
        const confirmed =
          window.confirm(
            "Are you sure you want to remove this from your collection?",
          );

        if (!confirmed) {
          return;
        }

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          console.error(
            "[Collection] Unable to identify current user:",
            userError?.message,
          );

          return;
        }

        const {
          error,
        } = await supabase
          .from(
            "watched_content",
          )
          .delete()
          .eq(
            "content_id",
            contentId,
          )
          .eq(
            "user_id",
            user.id,
          );

        if (error) {
          console.error(
            "[Collection] Failed to remove item:",
            error.message,
          );

          return;
        }

        /*
         * Update local caches immediately
         * after the database confirms deletion.
         */
        removeCollectionItem(
          contentId,
        );

        setWatchedItems(
          (previous) =>
            previous.filter(
              (item) =>
                item.content_id !==
                contentId,
            ),
        );

        const watchedIds =
          getCatalogState()
            .watchedIds;

        setCatalogState({
          watchedIds:
            watchedIds.filter(
              (id) =>
                id !==
                contentId,
            ),
        });
      },
      [],
    );

  /* ------------------------------------------------------------------------ */
  /* Statistics                                                               */
  /* ------------------------------------------------------------------------ */

  const stats =
    useMemo(() => {
      let movies = 0;
      let tv = 0;
      let anime = 0;
      let kdrama = 0;
      let currentYearCount =
        0;

      for (const item of watchedItems) {
        switch (
          item.media_type
        ) {
          case "movie":
            movies += 1;
            break;

          case "tv":
            tv += 1;
            break;

          case "anime":
            anime += 1;
            break;

          case "k-drama":
            kdrama += 1;
            break;

          default:
            break;
        }

        if (
          getReleaseYear(
            item.release_date,
          ) === currentYear
        ) {
          currentYearCount +=
            1;
        }
      }

      return {
        total:
          watchedItems.length,
        movies,
        tv,
        anime,
        kdrama,
        currentYear:
          currentYearCount,
      };
    }, [
      watchedItems,
      currentYear,
    ]);

  /* ------------------------------------------------------------------------ */
  /* Filtering                                                                */
  /* ------------------------------------------------------------------------ */

  const normalizedSearch =
    searchQuery
      .trim()
      .toLowerCase();

  const filteredItems =
    useMemo(() => {
      return watchedItems.filter(
        (item) => {
          const matchesSearch =
            !normalizedSearch ||
            item.title
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          if (!matchesSearch) {
            return false;
          }

          if (
            activeTab === "all"
          ) {
            return true;
          }

          if (
            MEDIA_TYPES.includes(
              activeTab as MediaType,
            )
          ) {
            return (
              item.media_type ===
              activeTab
            );
          }

          if (
            activeTab ===
            String(currentYear)
          ) {
            return (
              getReleaseYear(
                item.release_date,
              ) ===
              currentYear
            );
          }

          return false;
        },
      );
    }, [
      watchedItems,
      normalizedSearch,
      activeTab,
      currentYear,
    ]);

  const displayedItems =
    useMemo(
      () =>
        filteredItems.slice(
          0,
          visibleCount,
        ),
      [
        filteredItems,
        visibleCount,
      ],
    );

  /* ------------------------------------------------------------------------ */
  /* ContentCard mapping                                                      */
  /* ------------------------------------------------------------------------ */

  const displayedCards =
    useMemo(
      () =>
        displayedItems.map(
          (item) => {
            const contentItem: ContentItem =
              {
                id: item.content_id,
                title: item.title,
                poster_path:
                  item.poster_path,
                backdrop_path:
                  "",
                release_date:
                  item.release_date ||
                  "TBA",
                vote_average:
                  item.vote_average,
                vote_count: 0,
                media_type:
                  item.media_type,
                genre_ids: [],
                overview: "",
                popularity: 0,
                adult: false,
                season_count:
                  item.season_count ??
                  undefined,
              };

            return {
              id: item.content_id,
              contentItem,
            };
          },
        ),
      [displayedItems],
    );

  /* ------------------------------------------------------------------------ */
  /* Stat cards                                                               */
  /* ------------------------------------------------------------------------ */

  const statCards = useMemo(
    () => [
      {
        id: "all",
        label: "All",
        value: stats.total,
        icon: Library,
        color: "text-white",
      },
      {
        id: "movie",
        label: "Movies",
        value: stats.movies,
        icon: Film,
        color: "text-primary",
      },
      {
        id: "tv",
        label: "Series",
        value: stats.tv,
        icon: Tv,
        color: "text-blue-400",
      },
      {
        id: "anime",
        label: "Anime",
        value: stats.anime,
        icon: Sparkles,
        color: "text-purple-400",
      },
      {
        id: "k-drama",
        label: "K-Drama",
        value: stats.kdrama,
        icon: Heart,
        color: "text-pink-400",
      },
      {
        id: String(
          currentYear,
        ),
        label: String(
          currentYear,
        ),
        value:
          stats.currentYear,
        icon: Calendar,
        color: "text-emerald-400",
      },
    ],
    [stats, currentYear],
  );

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleTabChange =
    useCallback(
      (tab: string) => {
        setActiveTab(tab);
        setVisibleCount(
          PAGE_SIZE,
        );
      },
      [],
    );

  const handleSearchChange =
    useCallback(
      (
        event: React.ChangeEvent<HTMLInputElement>,
      ) => {
        setSearchQuery(
          event.target.value,
        );
        setVisibleCount(
          PAGE_SIZE,
        );
      },
      [],
    );

  const loadMore =
    useCallback(() => {
      setVisibleCount(
        (previous) =>
          previous +
          PAGE_SIZE,
      );
    }, []);

  const scrollToTop =
    useCallback(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, []);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl flex-1 p-5 pb-28 md:p-8 lg:p-12 lg:pb-12">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}

        <header className="mb-8 space-y-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <CheckCircle2
                  size={14}
                  aria-hidden="true"
                />

                Personal Vault
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                Your{" "}
                <span className="text-primary">
                  Collection
                </span>
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage and filter your
                tracked watch history.
              </p>
            </div>

            <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto">
              <div className="group relative flex-1 sm:w-64">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                  size={18}
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={
                    handleSearchChange
                  }
                  placeholder="Search collection..."
                  aria-label="Search collection"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/stats",
                  )
                }
                className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-black lg:hidden"
              >
                <BarChart3
                  size={16}
                  aria-hidden="true"
                />
                Detailed Stats
              </button>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Statistics                                                      */}
          {/* -------------------------------------------------------------- */}

          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
            {statCards.map(
              (
                stat,
                index,
              ) => {
                const Icon =
                  stat.icon;

                const active =
                  activeTab ===
                  stat.id;

                return (
                  <motion.button
                    key={stat.id}
                    type="button"
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.05,
                    }}
                    onClick={() =>
                      handleTabChange(
                        stat.id,
                      )
                    }
                    aria-pressed={
                      active
                    }
                    className={cn(
                      "glass-card relative flex flex-col items-center overflow-hidden rounded-2xl border p-4 text-center transition-all",
                      active
                        ? "scale-[1.03] border-primary/60 bg-primary/10 cinematic-glow"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20",
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-0 h-1 w-full bg-primary" />
                    )}

                    <Icon
                      className={cn(
                        "mb-2 transition-transform group-hover:scale-110",
                        stat.color,
                      )}
                      size={22}
                      aria-hidden="true"
                    />

                    <p className="text-2xl font-bold tracking-tight text-white">
                      {stat.value}
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                  </motion.button>
                );
              },
            )}
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}

        {loading ? (
          <div
            className="flex items-center justify-center py-20"
            role="status"
            aria-label="Loading collection"
          >
            <Loader2
              className="animate-spin text-primary"
              size={48}
            />
          </div>
        ) : filteredItems.length ===
          0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-32 text-center opacity-50">
            <Library
              size={56}
              className="mb-2 text-primary/30"
              aria-hidden="true"
            />

            <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
              No Titles Found
            </h2>

            <p className="text-xs text-muted-foreground">
              Try switching category
              tabs or logging more
              content.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-[18px] sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
              {displayedCards.map(
                ({
                  id,
                  contentItem,
                }) => (
                  <div
                    key={id}
                    className="group relative"
                  >
                    <ContentCard
                      item={
                        contentItem
                      }
                      isWatched
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void removeWatched(
                          id,
                        )
                      }
                      aria-label={`Remove ${contentItem.title} from collection`}
                      title="Remove from watched"
                      className="absolute left-2.5 top-2.5 z-30 rounded-full bg-red-500/90 p-2 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <Trash2
                        size={14}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                ),
              )}
            </div>

            {visibleCount <
              filteredItems.length && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={
                    loadMore
                  }
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.08]"
                >
                  <Plus
                    size={16}
                    aria-hidden="true"
                  />
                  Load More Titles
                </button>
              </div>
            )}
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Scroll to top                                                     */}
        {/* ---------------------------------------------------------------- */}

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              initial={{
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
              }}
              onClick={
                scrollToTop
              }
              aria-label="Scroll to top"
              className="fixed bottom-24 right-6 z-50 rounded-full bg-primary p-4 text-black shadow-2xl transition-transform hover:scale-110"
            >
              <ChevronUp
                size={20}
                aria-hidden="true"
              />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Collection;