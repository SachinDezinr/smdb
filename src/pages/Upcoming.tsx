import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Navigation } from "@/components/layout/Navigation";
import { ContentCard } from "@/components/content/ContentCard";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

import {
  ContentItem,
  MediaType,
  Region,
  fetchContent,
  fetchUpcoming,
} from "@/lib/tmdb";

import {
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CATEGORIES: Array<{
  label: string;
  value: MediaType;
}> = [
  {
    label: "Movies",
    value: "movie",
  },
  {
    label: "Web Series",
    value: "tv",
  },
  {
    label: "Anime",
    value: "anime",
  },
  {
    label: "K-Drama",
    value: "k-drama",
  },
];

const REGIONS: Array<{
  label: string;
  value: Region;
}> = [
  {
    label: "All Regions",
    value: "all",
  },
  {
    label: "Hollywood",
    value: "hollywood",
  },
  {
    label: "Bollywood",
    value: "bollywood",
  },
  {
    label: "Pollywood",
    value: "punjabi",
  },
  {
    label: "Tollywood",
    value: "south-indian",
  },
  {
    label: "Animated",
    value: "animated",
  },
];

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

const isUpcomingRelease = (
  item: ContentItem,
  today: string,
): boolean => {
  if (
    !item.release_date ||
    item.release_date === "TBA"
  ) {
    return true;
  }

  return item.release_date > today;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const Upcoming = () => {
  const [
    activeCategory,
    setActiveCategory,
  ] = useState<MediaType>("movie");

  const [
    activeRegion,
    setActiveRegion,
  ] = useState<Region>("all");

  const [
    activeYear,
    setActiveYear,
  ] = useState<number | null>(
    null,
  );

  const [
    items,
    setItems,
  ] = useState<ContentItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    searchResults,
    setSearchResults,
  ] = useState<ContentItem[]>([]);

  /*
   * Always show next year's lineup.
   * This removes the old hardcoded 2027 dependency.
   */
  const nextYear =
    new Date().getFullYear() + 1;

  /*
   * Each request gets a generation number.
   * A slower request from an older filter/search
   * combination can therefore never overwrite
   * the current page.
   */
  const requestGeneration =
    useRef(0);

  const requestController =
    useRef<AbortController | null>(
      null,
    );

  /* ------------------------------------------------------------------------ */
  /* Request lifecycle                                                        */
  /* ------------------------------------------------------------------------ */

  const beginRequest =
    useCallback(() => {
      requestController.current?.abort();

      const controller =
        new AbortController();

      requestController.current =
        controller;

      const generation =
        ++requestGeneration.current;

      return {
        controller,
        generation,
      };
    }, []);

  const isCurrentRequest =
    useCallback(
      (
        generation: number,
        controller: AbortController,
      ) =>
        generation ===
          requestGeneration.current &&
        !controller.signal.aborted,
      [],
    );

  /* ------------------------------------------------------------------------ */
  /* Upcoming loader                                                          */
  /* ------------------------------------------------------------------------ */

  const load = useCallback(
    async (
      pageNumber = 1,
    ) => {
      const {
        controller,
        generation,
      } = beginRequest();

      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const today =
          getLocalToday();

        let data: ContentItem[];

        if (activeYear) {
          data =
            await fetchContent(
              activeCategory,
              activeYear,
              pageNumber,
              "",
              activeRegion,
              controller.signal,
            );

          if (
            !isCurrentRequest(
              generation,
              controller,
            )
          ) {
            return;
          }

          data = data
            .filter((item) =>
              isUpcomingRelease(
                item,
                today,
              ),
            )
            .sort(
              (
                first,
                second,
              ) => {
                if (
                  first.release_date ===
                  "TBA"
                ) {
                  return 1;
                }

                if (
                  second.release_date ===
                  "TBA"
                ) {
                  return -1;
                }

                return first.release_date.localeCompare(
                  second.release_date,
                );
              },
            );
        } else {
          data =
            await fetchUpcoming(
              activeCategory,
              activeRegion,
              pageNumber,
              controller.signal,
            );

          if (
            !isCurrentRequest(
              generation,
              controller,
            )
          ) {
            return;
          }

          data = data.filter(
            (item) =>
              isUpcomingRelease(
                item,
                today,
              ),
          );
        }

        if (
          !isCurrentRequest(
            generation,
            controller,
          )
        ) {
          return;
        }

        setItems((previous) =>
          pageNumber === 1
            ? data
            : [
                ...previous,
                ...data,
              ],
        );

        setPage(
          pageNumber,
        );
      } catch (error) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        console.error(
          "[Upcoming] Failed to load releases:",
          error,
        );

        if (
          pageNumber === 1 &&
          isCurrentRequest(
            generation,
            controller,
          )
        ) {
          showError(
            "Failed to load upcoming releases",
          );
        }
      } finally {
        if (
          !isCurrentRequest(
            generation,
            controller,
          )
        ) {
          return;
        }

        if (pageNumber === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [
      activeCategory,
      activeRegion,
      activeYear,
      beginRequest,
      isCurrentRequest,
    ],
  );

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /* ------------------------------------------------------------------------ */

  const performSearch =
    useCallback(
      async (query: string) => {
        const trimmedQuery =
          query.trim();

        if (!trimmedQuery) {
          requestController.current?.abort();
          setIsSearching(false);
          setSearchResults([]);
          setLoading(false);
          return;
        }

        const {
          controller,
          generation,
        } = beginRequest();

        setIsSearching(true);
        setLoading(true);

        try {
          const results =
            await fetchContent(
              activeCategory,
              undefined,
              1,
              trimmedQuery,
              activeRegion,
              controller.signal,
            );

          if (
            !isCurrentRequest(
              generation,
              controller,
            )
          ) {
            return;
          }

          const today =
            getLocalToday();

          setSearchResults(
            results.filter(
              (item) =>
                isUpcomingRelease(
                  item,
                  today,
                ),
            ),
          );
        } catch (error) {
          if (
            controller.signal.aborted
          ) {
            return;
          }

          console.error(
            "[Upcoming] Search failed:",
            error,
          );

          showError(
            "Search failed",
          );
        } finally {
          if (
            isCurrentRequest(
              generation,
              controller,
            )
          ) {
            setLoading(false);
          }
        }
      },
      [
        activeCategory,
        activeRegion,
        beginRequest,
        isCurrentRequest,
      ],
    );

  /* ------------------------------------------------------------------------ */
  /* Debounced search                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const trimmedQuery =
      searchQuery.trim();

    if (!trimmedQuery) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    const timer =
      window.setTimeout(() => {
        void performSearch(
          trimmedQuery,
        );
      }, 350);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    searchQuery,
    performSearch,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Filter changes                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    /*
     * Search owns the request lifecycle
     * while a query is active.
     */
    if (
      searchQuery.trim()
    ) {
      return;
    }

    void load(1);

    return () => {
      requestController.current?.abort();
    };
  }, [
    activeCategory,
    activeRegion,
    activeYear,
    searchQuery,
    load,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Cleanup                                                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      requestController.current?.abort();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Derived values                                                           */
  /* ------------------------------------------------------------------------ */

  const showRegionFilters =
    !isSearching &&
    (activeCategory ===
      "movie" ||
      activeCategory ===
        "tv");

  const activeCategoryLabel =
    CATEGORIES.find(
      (category) =>
        category.value ===
        activeCategory,
    )?.label ??
    "Movies";

  const activeRegionLabel =
    REGIONS.find(
      (region) =>
        region.value ===
        activeRegion,
    )?.label ??
    "All Regions";

  const displayedItems =
    isSearching
      ? searchResults
      : items;

  const hasNoSearchResults =
    isSearching &&
    !loading &&
    searchResults.length ===
      0;

  const hasNoUpcomingItems =
    !isSearching &&
    !loading &&
    items.length === 0;

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                 */
  /* ------------------------------------------------------------------------ */

  const handleCategoryChange =
    useCallback(
      (category: MediaType) => {
        setActiveCategory(
          category,
        );
        setPage(1);
        setItems([]);
      },
      [],
    );

  const handleRegionChange =
    useCallback(
      (region: Region) => {
        setActiveRegion(
          region,
        );
        setPage(1);
        setItems([]);
      },
      [],
    );

  const toggleNextYear =
    useCallback(() => {
      setActiveYear(
        (current) =>
          current === nextYear
            ? null
            : nextYear,
      );

      setPage(1);
      setItems([]);
    }, [nextYear]);

  const clearSearch =
    useCallback(() => {
      requestController.current?.abort();
      setSearchQuery("");
      setIsSearching(false);
      setSearchResults([]);
    }, []);

  const handleSearchChange =
    useCallback(
      (
        event: React.ChangeEvent<HTMLInputElement>,
      ) => {
        setSearchQuery(
          event.target.value,
        );
      },
      [],
    );

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
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <CalendarIcon
                  size={14}
                  aria-hidden="true"
                />
                Premiere Schedule
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                Upcoming{" "}
                <span className="text-primary">
                  Releases
                </span>
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Anticipated cinema and
                streaming drops slated
                for the near future.
              </p>
            </div>

            {/* Search */}
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="group relative flex-1 sm:w-64">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                  size={18}
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={
                    searchQuery
                  }
                  onChange={
                    handleSearchChange
                  }
                  placeholder="Search upcoming..."
                  aria-label="Search upcoming releases"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-10 text-sm text-white placeholder-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    aria-label="Clear search"
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
            <div className="space-y-2.5">
              {/* ---------------------------------------------------------- */}
              {/* Desktop controls                                           */}
              {/* ---------------------------------------------------------- */}

              <div className="hidden flex-col items-center justify-center gap-2 lg:flex">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {CATEGORIES.map(
                    (category) => {
                      const active =
                        activeCategory ===
                        category.value;

                      return (
                        <button
                          key={
                            category.value
                          }
                          type="button"
                          onClick={() =>
                            handleCategoryChange(
                              category.value,
                            )
                          }
                          aria-pressed={
                            active
                          }
                          className={cn(
                            "rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                            active
                              ? "scale-[1.02] border-primary bg-primary text-black shadow-lg shadow-primary/20"
                              : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.07] hover:text-white",
                          )}
                        >
                          {
                            category.label
                          }
                        </button>
                      );
                    },
                  )}

                  <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

                  <button
                    type="button"
                    onClick={
                      toggleNextYear
                    }
                    aria-pressed={
                      activeYear ===
                      nextYear
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                      activeYear ===
                        nextYear
                        ? "scale-[1.02] border-primary bg-primary/20 text-primary shadow-lg shadow-primary/5"
                        : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.07]",
                    )}
                  >
                    <Sparkles
                      size={13}
                      className={
                        activeYear ===
                        nextYear
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                      aria-hidden="true"
                    />

                    {nextYear} Lineup
                  </button>
                </div>

                {showRegionFilters && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {REGIONS.map(
                      (region) => {
                        const active =
                          activeRegion ===
                          region.value;

                        return (
                          <button
                            key={
                              region.value
                            }
                            type="button"
                            onClick={() =>
                              handleRegionChange(
                                region.value,
                              )
                            }
                            aria-pressed={
                              active
                            }
                            className={cn(
                              "rounded-xl border px-3.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all",
                              active
                                ? "border-primary/60 bg-white/15 text-primary shadow-sm"
                                : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-white",
                            )}
                          >
                            {
                              region.label
                            }
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------------- */}
              {/* Mobile controls                                            */}
              {/* ---------------------------------------------------------- */}

              <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                  >
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-md"
                    >
                      <LayoutGrid
                        size={14}
                        aria-hidden="true"
                      />

                      {
                        activeCategoryLabel
                      }

                      <ChevronDown
                        size={12}
                        aria-hidden="true"
                      />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="border-white/10 bg-neutral-950 text-white">
                    {CATEGORIES.map(
                      (category) => (
                        <DropdownMenuItem
                          key={
                            category.value
                          }
                          onClick={() =>
                            handleCategoryChange(
                              category.value,
                            )
                          }
                          className="py-2 text-xs font-semibold"
                        >
                          {
                            category.label
                          }
                        </DropdownMenuItem>
                      ),
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {showRegionFilters && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold tracking-wide text-white"
                      >
                        <Filter
                          size={13}
                          className="text-primary"
                          aria-hidden="true"
                        />

                        {
                          activeRegionLabel
                        }

                        <ChevronDown
                          size={12}
                          aria-hidden="true"
                        />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="border-white/10 bg-neutral-950 text-white">
                      {REGIONS.map(
                        (region) => (
                          <DropdownMenuItem
                            key={
                              region.value
                            }
                            onClick={() =>
                              handleRegionChange(
                                region.value,
                              )
                            }
                            className="py-2 text-xs font-semibold"
                          >
                            {
                              region.label
                            }
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <button
                  type="button"
                  onClick={
                    toggleNextYear
                  }
                  aria-pressed={
                    activeYear ===
                    nextYear
                  }
                  className={cn(
                    "flex items-center gap-1 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
                    activeYear ===
                      nextYear
                      ? "border-primary bg-primary/20 text-primary shadow-sm"
                      : "border-white/10 bg-white/[0.04] text-white/80",
                  )}
                >
                  <Sparkles
                    size={12}
                    className={
                      activeYear ===
                      nextYear
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                    aria-hidden="true"
                  />

                  {nextYear}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}

        {loading ? (
          <div
            className="flex items-center justify-center py-16"
            role="status"
            aria-label="Loading upcoming releases"
          >
            <Loader2
              className="animate-spin text-primary"
              size={40}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-[18px] sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
              {displayedItems.map(
                (item) => (
                  <ContentCard
                    key={`${item.media_type}-${item.id}`}
                    item={item}
                    showReleaseDate
                    showCategory={
                      isSearching ||
                      activeYear ===
                        nextYear
                    }
                  />
                ),
              )}
            </div>

            {/* Search empty state */}
            {hasNoSearchResults && (
              <div className="space-y-2 py-16 text-center opacity-50">
                <p className="text-lg font-semibold">
                  No upcoming results
                  found
                </p>

                <p className="text-xs text-muted-foreground">
                  Try another title or
                  release keyword
                </p>
              </div>
            )}

            {/* Upcoming empty state */}
            {hasNoUpcomingItems && (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-50">
                <CalendarIcon
                  size={48}
                  className="mb-3 text-primary/30"
                  aria-hidden="true"
                />

                <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">
                  No Announced Releases
                </h2>

                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {activeRegion !==
                  "all"
                    ? `No ${activeRegion} content announced yet${
                        activeYear
                          ? ` for ${activeYear}`
                          : ""
                      }.`
                    : `Nothing officially dated for this category yet${
                        activeYear
                          ? ` for ${activeYear}`
                          : ""
                      }.`}
                </p>
              </div>
            )}

            {/* Load more */}
            {!isSearching &&
              items.length >
                0 && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      void load(
                        page + 1,
                      )
                    }
                    disabled={
                      loadingMore
                    }
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2
                        className="animate-spin"
                        size={15}
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        size={15}
                        aria-hidden="true"
                      />
                    )}

                    Load More Releases
                  </button>
                </div>
              )}
          </>
        )}
      </main>
    </div>
  );
};

export default Upcoming;