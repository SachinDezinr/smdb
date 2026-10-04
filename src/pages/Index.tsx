import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Compass,
  Search,
  X,
} from "lucide-react";

import { Navigation } from "@/components/layout/Navigation";
import { TrendingHero } from "@/components/content/TrendingHero";
import { CatalogFilters } from "@/components/content/CatalogFilters";
import { CatalogSearchResults } from "@/components/content/CatalogSearchResults";
import { YearSection } from "@/components/content/YearSection";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

import {
  ContentItem,
  ContentCredits,
  fetchContent,
  getCachedTvSeason,
  getStartYear,
  MediaType,
  Region,
} from "@/lib/tmdb";

import { supabase } from "@/lib/supabase";

import {
  showError,
  showSuccess,
} from "@/utils/toast";

import {
  getCatalogState,
  setCatalogState,
} from "@/lib/catalogStore";

import {
  addCollectionItem,
  removeCollectionItem,
} from "@/lib/collectionStore";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SEARCH_DEBOUNCE_MS = 350;

const SCROLL_HEADER_OFFSET = 80;

const EMPTY_ITEMS: ContentItem[] = [];

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * Read the persistent catalog state once.
   * This avoids repeatedly calling getCatalogState()
   * during renders.
   */
  const initialStore = useMemo(
    () => getCatalogState(),
    [],
  );

  const [
    activeCategory,
    setActiveCategory,
  ] = useState<MediaType>(
    initialStore.activeCategory,
  );

  const [
    activeRegion,
    setActiveRegion,
  ] = useState<Region>(
    initialStore.activeRegion,
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState(
    initialStore.searchQuery,
  );

  const [
    isSearching,
    setIsSearching,
  ] = useState(
    Boolean(initialStore.searchQuery),
  );

  const [
    searchResults,
    setSearchResults,
  ] = useState<ContentItem[]>(
    EMPTY_ITEMS,
  );

  const [
    expandedYears,
    setExpandedYears,
  ] = useState<number[]>(
    initialStore.expandedYears,
  );

  const [
    yearData,
    setYearData,
  ] = useState<
    Record<number, ContentItem[]>
  >(
    initialStore.yearData,
  );

  const [
    yearPages,
    setYearPages,
  ] = useState<
    Record<number, number>
  >(
    initialStore.yearPages,
  );

  const [
    loadingYears,
    setLoadingYears,
  ] = useState<
    Record<number, boolean>
  >({});

  const [
    watchedIds,
    setWatchedIds,
  ] = useState<number[]>(
    initialStore.watchedIds,
  );

  const [
    highlightedYear,
    setHighlightedYear,
  ] = useState<number | null>(
    null,
  );

  /*
   * Used to invalidate requests that started under
   * previous category/region filters.
   */
  const requestGeneration =
    useRef(0);

  /*
   * Prevent unnecessary filter initialization logic.
   */
  const previousFilters =
    useRef({
      category: activeCategory,
      region: activeRegion,
    });

  /*
   * Used to invalidate old search requests.
   */
  const searchGeneration =
    useRef(0);

  const currentYear =
    new Date().getFullYear();

  /* ------------------------------------------------------------------------ */
  /* Derived years                                                            */
  /* ------------------------------------------------------------------------ */

  const years = useMemo(() => {
    const startYear =
      getStartYear(
        activeCategory,
        activeRegion,
      );

    const count = Math.max(
      1,
      currentYear -
        startYear +
        1,
    );

    return Array.from(
      { length: count },
      (_, index) =>
        currentYear - index,
    );
  }, [
    activeCategory,
    activeRegion,
    currentYear,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Watched content                                                          */
  /* ------------------------------------------------------------------------ */

  const fetchWatchedIds =
    useCallback(async () => {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        console.error(
          "[Collection] Failed to get user:",
          userError.message,
        );

        setWatchedIds([]);
        return;
      }

      if (!user) {
        setWatchedIds([]);
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("watched_content")
          .select("content_id")
          .eq(
            "user_id",
            user.id,
          );

      if (error) {
        console.error(
          "[Collection] Failed to load watched IDs:",
          error.message,
        );

        return;
      }

      setWatchedIds(
        data?.map(
          (item) =>
            item.content_id,
        ) ?? [],
      );
    }, []);

  useEffect(() => {
    void fetchWatchedIds();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          void fetchWatchedIds();
        },
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchWatchedIds]);

  /* ------------------------------------------------------------------------ */
  /* Persistent catalog state                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setCatalogState({
      activeCategory,
      activeRegion,
    });
  }, [
    activeCategory,
    activeRegion,
  ]);

  useEffect(() => {
    setCatalogState({
      searchQuery,
    });
  }, [searchQuery]);

  useEffect(() => {
    setCatalogState({
      watchedIds,
    });
  }, [watchedIds]);

  useEffect(() => {
    setCatalogState({
      expandedYears,
    });
  }, [expandedYears]);

  useEffect(() => {
    setCatalogState({
      yearData,
      yearPages,
    });
  }, [
    yearData,
    yearPages,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /* ------------------------------------------------------------------------ */

  const performSearch =
    useCallback(
      async (
        query: string,
      ) => {
        const trimmedQuery =
          query.trim();

        if (!trimmedQuery) {
          setIsSearching(false);
          setSearchResults(
            EMPTY_ITEMS,
          );
          return;
        }

        const generation =
          ++searchGeneration.current;

        setIsSearching(true);

        setLoadingYears(
          (previous) => ({
            ...previous,
            0: true,
          }),
        );

        try {
          const results =
            await fetchContent(
              activeCategory,
              undefined,
              1,
              trimmedQuery,
              activeRegion,
            );

          /*
           * User may have typed another query
           * while this request was running.
           */
          if (
            generation !==
            searchGeneration.current
          ) {
            return;
          }

          setSearchResults(
            results,
          );
        } catch (error) {
          if (
            generation !==
            searchGeneration.current
          ) {
            return;
          }

          console.error(
            "[Catalog] Search failed:",
            error,
          );

          showError(
            "Search failed. Please try again.",
          );

          setSearchResults(
            EMPTY_ITEMS,
          );
        } finally {
          if (
            generation ===
            searchGeneration.current
          ) {
            setLoadingYears(
              (previous) => ({
                ...previous,
                0: false,
              }),
            );
          }
        }
      },
      [
        activeCategory,
        activeRegion,
      ],
    );

  useEffect(() => {
    const trimmedQuery =
      searchQuery.trim();

    const timer =
      window.setTimeout(() => {
        if (!trimmedQuery) {
          setIsSearching(false);
          setSearchResults(
            EMPTY_ITEMS,
          );
          return;
        }

        void performSearch(
          trimmedQuery,
        );
      }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);

      /*
       * Invalidate a request that may still
       * resolve after the input changes.
       */
      searchGeneration.current += 1;
    };
  }, [
    searchQuery,
    performSearch,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Year content                                                             */
  /* ------------------------------------------------------------------------ */

  const loadYearContent =
    useCallback(
      async (
        year: number,
        page = 1,
      ) => {
        const generation =
          requestGeneration.current;

        setLoadingYears(
          (previous) => ({
            ...previous,
            [year]: true,
          }),
        );

        try {
          const results =
            await fetchContent(
              activeCategory,
              year,
              page,
              "",
              activeRegion,
            );

          /*
           * Category or region changed while
           * this request was running.
           */
          if (
            generation !==
            requestGeneration.current
          ) {
            return;
          }

          setYearData(
            (previous) => {
              if (page === 1) {
                return {
                  ...previous,
                  [year]: results,
                };
              }

              const existing =
                previous[year] ??
                EMPTY_ITEMS;

              const existingIds =
                new Set(
                  existing.map(
                    (item) =>
                      item.id,
                  ),
                );

              const newItems =
                results.filter(
                  (item) =>
                    !existingIds.has(
                      item.id,
                    ),
                );

              return {
                ...previous,
                [year]: [
                  ...existing,
                  ...newItems,
                ],
              };
            },
          );

          setYearPages(
            (previous) => ({
              ...previous,
              [year]: page,
            }),
          );
        } catch (error) {
          if (
            generation !==
            requestGeneration.current
          ) {
            return;
          }

          console.error(
            `[Catalog] Failed to fetch ${year}:`,
            error,
          );
        } finally {
          if (
            generation ===
            requestGeneration.current
          ) {
            setLoadingYears(
              (previous) => ({
                ...previous,
                [year]: false,
              }),
            );
          }
        }
      },
      [
        activeCategory,
        activeRegion,
      ],
    );

  /* ------------------------------------------------------------------------ */
  /* Year controls                                                            */
  /* ------------------------------------------------------------------------ */

  const toggleYear =
    useCallback(
      (year: number) => {
        const isExpanded =
          expandedYears.includes(
            year,
          );

        setExpandedYears(
          (previous) =>
            previous.includes(year)
              ? previous.filter(
                  (value) =>
                    value !== year,
                )
              : [
                  ...previous,
                  year,
                ],
        );

        if (isExpanded) {
          setHighlightedYear(
            year,
          );
          return;
        }

        setHighlightedYear(
          null,
        );

        if (
          !yearData[year]
        ) {
          void loadYearContent(
            year,
            1,
          );
        }
      },
      [
        expandedYears,
        yearData,
        loadYearContent,
      ],
    );

  const handleCloseYear =
    useCallback(
      (year: number) => {
        setExpandedYears(
          (previous) =>
            previous.filter(
              (value) =>
                value !== year,
            ),
        );

        setHighlightedYear(
          year,
        );

        window.setTimeout(
          () => {
            const element =
              document.getElementById(
                `year-section-${year}`,
              );

            if (!element) {
              return;
            }

            const elementPosition =
              element.getBoundingClientRect()
                .top;

            const offsetPosition =
              elementPosition +
              window.scrollY -
              SCROLL_HEADER_OFFSET;

            window.scrollTo({
              top: Math.max(
                0,
                offsetPosition,
              ),
              behavior:
                "smooth",
            });
          },
          50,
        );
      },
      [],
    );

  /* ------------------------------------------------------------------------ */
  /* Watched / Collection                                                     */
  /* ------------------------------------------------------------------------ */

  const toggleWatched =
    useCallback(
      async (
        item: ContentItem,
      ) => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          const currentPath =
            location.pathname +
            location.search;

          const params =
            new URLSearchParams({
              return_to:
                currentPath || "/",

              action:
                "add_collection",

              movie_id:
                String(item.id),

              media_type:
                item.media_type,

              title: item.title,

              poster_path:
                item.poster_path,

              release_date:
                item.release_date,

              vote_average:
                String(
                  item.vote_average,
                ),
            });

          navigate(
            `/login?${params.toString()}`,
          );

          return;
        }

        const isWatched =
          watchedIds.includes(
            item.id,
          );

        if (isWatched) {
          const {
            error,
          } =
            await supabase
              .from(
                "watched_content",
              )
              .delete()
              .eq(
                "user_id",
                user.id,
              )
              .eq(
                "content_id",
                item.id,
              );

          if (error) {
            console.error(
              "[Collection] Remove failed:",
              error.message,
            );

            showError(
              "Couldn't remove this title.",
            );

            return;
          }

          setWatchedIds(
            (previous) =>
              previous.filter(
                (id) =>
                  id !== item.id,
              ),
          );

          removeCollectionItem(
            item.id,
          );

          showSuccess(
            "Removed from collection",
          );

          return;
        }

        const collectionItem = {
          user_id: user.id,
          content_id: item.id,
          title: item.title,
          poster_path:
            item.poster_path,
          release_date:
            item.release_date,
          vote_average:
            item.vote_average,
          media_type:
            item.media_type,
          season_count:
            item.season_count ??
            getCachedTvSeason(
              item.id,
            ) ??
            null,
          created_at:
            new Date().toISOString(),
        };

        const {
          error,
        } =
          await supabase
            .from(
              "watched_content",
            )
            .insert(
              collectionItem,
            );

        if (error) {
          console.error(
            "[Collection] Add failed:",
            error.message,
          );

          showError(
            "Couldn't add this title to your collection.",
          );

          return;
        }

        setWatchedIds(
          (previous) =>
            previous.includes(
              item.id,
            )
              ? previous
              : [
                  ...previous,
                  item.id,
                ],
        );

        addCollectionItem(
          collectionItem,
        );

        showSuccess(
          "Added to your collection!",
        );
      },
      [
        location.pathname,
        location.search,
        navigate,
        watchedIds,
      ],
    );

  /* ------------------------------------------------------------------------ */
  /* Filter changes                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const previous =
      previousFilters.current;

    const filterChanged =
      previous.category !==
        activeCategory ||
      previous.region !==
        activeRegion;

    if (!filterChanged) {
      /*
       * On first render, load only the
       * already-expanded years restored
       * from the catalog store.
       */
      if (
        Object.keys(yearData)
          .length === 0 &&
        !isSearching
      ) {
        expandedYears.forEach(
          (year) => {
            void loadYearContent(
              year,
              1,
            );
          },
        );
      }

      return;
    }

    previousFilters.current = {
      category:
        activeCategory,
      region:
        activeRegion,
    };

    /*
     * Invalidate every request belonging
     * to the previous filter combination.
     */
    requestGeneration.current += 1;

    /*
     * Search belongs to the previous filter
     * context, so invalidate it too.
     */
    searchGeneration.current += 1;

    setYearData({});
    setYearPages({});
    setHighlightedYear(null);

    if (isSearching) {
      return;
    }

    /*
     * Reload only expanded years instead of
     * requesting the entire catalog.
     */
    expandedYears.forEach(
      (year) => {
        void loadYearContent(
          year,
          1,
        );
      },
    );
  }, [
    activeCategory,
    activeRegion,
    expandedYears,
    isSearching,
    loadYearContent,
    yearData,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Search clear                                                             */
  /* ------------------------------------------------------------------------ */

  const clearSearch =
    useCallback(() => {
      searchGeneration.current += 1;

      setSearchQuery("");
      setIsSearching(false);
      setSearchResults(
        EMPTY_ITEMS,
      );
      setCatalogState({
        searchQuery: "",
      });
    }, []);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />

      <ScrollToTop />

      <main className="mx-auto w-full max-w-7xl flex-1 p-5 pb-28 md:p-8 lg:p-12 lg:pb-12">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}

        <header className="mb-6 space-y-4">
          <div className="flex flex-col justify-between gap-4 md:gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <Compass
                  size={14}
                  aria-hidden="true"
                />

                <span>
                  Cinema Catalog
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                Discover{" "}
                <span className="text-primary">
                  SMDB
                </span>
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Explore movies, series, and
                anime categorized by release
                year.
              </p>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Search                                                         */}
            {/* ------------------------------------------------------------ */}

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="group relative flex-1 sm:w-64">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                  size={18}
                  aria-hidden="true"
                />

                <input
                  type="search"
                  placeholder="Search catalog..."
                  aria-label="Search catalog"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-10 text-sm text-white outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                />

                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={
                      clearSearch
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-white"
                  >
                    <X
                      size={16}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isSearching && (
            <CatalogFilters
              activeCategory={
                activeCategory
              }
              activeRegion={
                activeRegion
              }
              onCategoryChange={
                setActiveCategory
              }
              onRegionChange={
                setActiveRegion
              }
            />
          )}
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}

        {!isSearching && (
          <TrendingHero />
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-3">
          {isSearching ? (
            <CatalogSearchResults
              searchQuery={
                searchQuery
              }
              searchResults={
                searchResults
              }
              isLoading={
                Boolean(
                  loadingYears[0],
                )
              }
              watchedIds={
                watchedIds
              }
              onToggleWatched={
                toggleWatched
              }
              onClearSearch={
                clearSearch
              }
            />
          ) : (
            years.map((year) => (
              <YearSection
                key={year}
                year={year}
                isExpanded={expandedYears.includes(
                  year,
                )}
                isHighlighted={
                  highlightedYear ===
                  year
                }
                items={
                  yearData[year]
                }
                isLoading={Boolean(
                  loadingYears[
                    year
                  ],
                )}
                watchedIds={
                  watchedIds
                }
                onToggle={
                  toggleYear
                }
                onLoadMore={(
                  selectedYear,
                ) =>
                  void loadYearContent(
                    selectedYear,
                    (yearPages[
                      selectedYear
                    ] ?? 1) + 1,
                  )
                }
                onClose={
                  handleCloseYear
                }
                onToggleWatched={
                  toggleWatched
                }
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;