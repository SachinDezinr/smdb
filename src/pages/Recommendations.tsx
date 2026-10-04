import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Navigation } from "@/components/layout/Navigation";
import { ContentCard } from "@/components/content/ContentCard";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

import {
  ContentItem,
  fetchBestOfYear,
} from "@/lib/tmdb";

import {
  MOVIE_GENRES,
  TV_GENRES,
  COMMON_GENRES,
  GenreOption,
} from "@/lib/tmdb/genres";

import {
  Award,
  Check,
  ChevronDown,
  Clapperboard,
  Globe,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Tags,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type RecommendationCategory =
  | "movie"
  | "tv"
  | "kdrama"
  | "anime";

export type RecommendationRegion =
  | "all"
  | "hollywood"
  | "bollywood"
  | "pollywood"
  | "tollywood";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const END_YEAR = 1950;
const START_YEAR = new Date().getFullYear();

const ALL_YEARS = Array.from(
  {
    length:
      START_YEAR -
      END_YEAR +
      1,
  },
  (_, index) =>
    START_YEAR - index,
);

const INITIAL_YEARS_COUNT = 15;
const STEP_YEARS_COUNT = 12;

const FORMAT_OPTIONS: Array<{
  id: RecommendationCategory;
  label: string;
}> = [
  {
    id: "movie",
    label: "Movies",
  },
  {
    id: "tv",
    label: "Series",
  },
  {
    id: "kdrama",
    label: "K-Drama",
  },
  {
    id: "anime",
    label: "Anime",
  },
];

const REGION_OPTIONS: Array<{
  id: RecommendationRegion;
  label: string;
}> = [
  {
    id: "all",
    label: "All regions",
  },
  {
    id: "hollywood",
    label: "Hollywood",
  },
  {
    id: "bollywood",
    label: "Bollywood",
  },
  {
    id: "tollywood",
    label: "Tollywood",
  },
  {
    id: "pollywood",
    label: "Pollywood",
  },
];

const FORMAT_DROPDOWN_OPTIONS =
  FORMAT_OPTIONS.map(
    (option) => ({
      value: option.id,
      label: option.label,
    }),
  );

const REGION_DROPDOWN_OPTIONS =
  REGION_OPTIONS.map(
    (option) => ({
      value: option.id,
      label: option.label,
    }),
  );

const EMPTY_DATA: Record<
  number,
  ContentItem | null
> = {};

/* -------------------------------------------------------------------------- */
/* Dropdown                                                                   */
/* -------------------------------------------------------------------------- */

interface DropdownOption {
  value: string;
  label: string;
  prefix?: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  icon?: ReactNode;
}

const FilterDropdown = memo(
  function FilterDropdown({
    label,
    value,
    onChange,
    options,
    icon,
  }: FilterDropdownProps) {
    const [
      open,
      setOpen,
    ] = useState(false);

    const [
      activeIndex,
      setActiveIndex,
    ] = useState(0);

    const rootRef =
      useRef<HTMLDivElement>(null);

    const buttonRef =
      useRef<HTMLButtonElement>(null);

    const listRef =
      useRef<HTMLUListElement>(null);

    const listId = useId();

    const selectedIndex =
      Math.max(
        0,
        options.findIndex(
          (option) =>
            option.value === value,
        ),
      );

    const selected =
      options[selectedIndex];

    const openMenu =
      useCallback(() => {
        setActiveIndex(
          selectedIndex,
        );
        setOpen(true);
      }, [selectedIndex]);

    const closeMenu =
      useCallback(() => {
        setOpen(false);
      }, []);

    const choose =
      useCallback(
        (index: number) => {
          const option =
            options[index];

          if (!option) {
            return;
          }

          onChange(option.value);
          setOpen(false);

          requestAnimationFrame(
            () => {
              buttonRef.current?.focus();
            },
          );
        },
        [onChange, options],
      );

    useEffect(() => {
      if (!open) {
        return;
      }

      const handlePointerDown =
        (event: PointerEvent) => {
          const target =
            event.target;

          if (
            target instanceof Node &&
            !rootRef.current?.contains(
              target,
            )
          ) {
            setOpen(false);
          }
        };

      document.addEventListener(
        "pointerdown",
        handlePointerDown,
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown,
        );
      };
    }, [open]);

    useEffect(() => {
      if (!open) {
        return;
      }

      listRef.current?.children[
        activeIndex
      ]?.scrollIntoView({
        block: "nearest",
      });
    }, [open, activeIndex]);

    const handleKeyDown =
      useCallback(
        (
          event: KeyboardEvent<HTMLButtonElement>,
        ) => {
          if (!open) {
            if (
              event.key ===
                "ArrowDown" ||
              event.key ===
                "ArrowUp" ||
              event.key ===
                "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              openMenu();
            }

            return;
          }

          switch (event.key) {
            case "Escape":
              event.preventDefault();
              closeMenu();
              break;

            case "ArrowDown":
              event.preventDefault();

              setActiveIndex(
                (index) =>
                  Math.min(
                    index + 1,
                    options.length - 1,
                  ),
              );
              break;

            case "ArrowUp":
              event.preventDefault();

              setActiveIndex(
                (index) =>
                  Math.max(
                    index - 1,
                    0,
                  ),
              );
              break;

            case "Home":
              event.preventDefault();
              setActiveIndex(0);
              break;

            case "End":
              event.preventDefault();

              setActiveIndex(
                Math.max(
                  options.length - 1,
                  0,
                ),
              );
              break;

            case "Enter":
            case " ":
              event.preventDefault();
              choose(activeIndex);
              break;

            case "Tab":
              closeMenu();
              break;

            default:
              break;
          }
        },
        [
          activeIndex,
          choose,
          closeMenu,
          open,
          openMenu,
          options.length,
        ],
      );

    return (
      <div
        ref={rootRef}
        className="relative min-w-0 flex-1"
      >
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={
            open
              ? listId
              : undefined
          }
          aria-label={`${label}: ${
            selected?.label ?? ""
          }`}
          onClick={() =>
            open
              ? closeMenu()
              : openMenu()
          }
          onKeyDown={handleKeyDown}
          className="flex h-9 w-full items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-left text-xs font-medium text-white transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {icon && (
            <span
              className="mr-1.5 shrink-0 text-primary"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}

          <span className="min-w-0 flex-1 truncate">
            {selected?.prefix && (
              <span
                className="mr-2"
                aria-hidden="true"
              >
                {selected.prefix}
              </span>
            )}

            {selected?.label}
          </span>

          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open &&
                "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-neutral-900 p-1 text-white shadow-2xl"
          >
            {options.map(
              (
                option,
                index,
              ) => {
                const isSelected =
                  option.value ===
                  value;

                const isActive =
                  index ===
                  activeIndex;

                return (
                  <li
                    key={
                      option.value
                    }
                    role="option"
                    aria-selected={
                      isSelected
                    }
                    onPointerEnter={() =>
                      setActiveIndex(
                        index,
                      )
                    }
                    onClick={() =>
                      choose(index)
                    }
                    className={cn(
                      "flex cursor-pointer items-center rounded-lg px-3 py-2 text-xs",
                      isActive &&
                        "bg-white/10",
                      isSelected &&
                        "text-primary",
                    )}
                  >
                    {option.prefix && (
                      <span
                        className="mr-2"
                        aria-hidden="true"
                      >
                        {
                          option.prefix
                        }
                      </span>
                    )}

                    <span className="min-w-0 flex-1 truncate">
                      {
                        option.label
                      }
                    </span>

                    {isSelected && (
                      <Check
                        className="ml-2 h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

const YearSkeleton = memo(
  function YearSkeleton() {
    return (
      <div
        className="flex gap-3 sm:gap-5"
        aria-hidden="true"
      >
        <div className="aspect-[2/3] w-32 shrink-0 rounded-xl bg-white/[0.06] motion-safe:animate-pulse sm:w-36 md:w-40" />

        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3 w-28 rounded bg-white/[0.06] motion-safe:animate-pulse" />

          <div className="h-5 w-2/3 rounded bg-white/[0.08] motion-safe:animate-pulse" />

          <div className="space-y-2 pt-1">
            <div className="h-3 w-full rounded bg-white/[0.05] motion-safe:animate-pulse" />
            <div className="h-3 w-11/12 rounded bg-white/[0.05] motion-safe:animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-white/[0.05] motion-safe:animate-pulse" />
          </div>
        </div>
      </div>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Year entry                                                                 */
/* -------------------------------------------------------------------------- */

interface YearEntryProps {
  year: number;
  item: ContentItem | null | undefined;
  isLoading: boolean;
}

const YearEntry = memo(
  function YearEntry({
    year,
    item,
    isLoading,
  }: YearEntryProps) {
    return (
      <li
        id={`year-card-${year}`}
        className="flex scroll-mt-6 gap-6"
      >
        {/* Timeline rail */}
        <div className="relative hidden w-24 shrink-0 border-r border-white/10 pr-5 text-right sm:block">
          <span
            className={cn(
              "sticky top-20 block text-3xl font-black tabular-nums leading-none tracking-tight transition-colors",
              isLoading
                ? "text-primary/30"
                : "text-primary",
            )}
          >
            {year}
          </span>

          <span
            className={cn(
              "absolute -right-[4.5px] top-3 h-2 w-2 rounded-full ring-4 ring-background",
              isLoading
                ? "bg-white/20"
                : "bg-primary",
            )}
          />
        </div>

        <article className="min-w-0 flex-1 pb-6 sm:pb-10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:p-5">
            <p
              className={cn(
                "mb-3 text-xl font-black tabular-nums leading-none sm:hidden",
                isLoading
                  ? "text-primary/30"
                  : "text-primary",
              )}
            >
              {year}
            </p>

            {isLoading ||
            !item ? (
              <YearSkeleton />
            ) : (
              <>
                <div className="flex gap-3 sm:gap-5">
                  <div className="w-32 shrink-0 sm:w-36 md:w-40">
                    <ContentCard
                      item={item}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="rounded-md bg-white/[0.08] px-2 py-0.5 font-medium text-white/90">
                        {item.media_type ===
                        "movie"
                          ? "Movie"
                          : "Series"}
                      </span>

                      {item.vote_count >
                        0 && (
                        <span className="hidden sm:inline">
                          {item.vote_count.toLocaleString()}{" "}
                          votes
                        </span>
                      )}
                    </div>

                    <h2 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-white sm:text-xl">
                      {item.title}
                    </h2>

                    <p className="line-clamp-4 max-w-prose text-xs leading-relaxed text-muted-foreground sm:line-clamp-5 sm:text-sm">
                      {item.overview ||
                        "No synopsis available for this title."}
                    </p>
                  </div>
                </div>

                {item.release_date &&
                  item.release_date !==
                    "TBA" && (
                    <p className="mt-3 text-right text-[11px] font-semibold text-primary sm:text-xs">
                      Released:{" "}
                      {item.release_date}
                    </p>
                  )}
              </>
            )}
          </div>
        </article>
      </li>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Recommendations page                                                       */
/* -------------------------------------------------------------------------- */

export default function Recommendations() {
  const [
    category,
    setCategory,
  ] =
    useState<RecommendationCategory>(
      "movie",
    );

  const [
    region,
    setRegion,
  ] =
    useState<RecommendationRegion>(
      "all",
    );

  const [
    selectedGenre,
    setSelectedGenre,
  ] = useState("all");

  /* ------------------------------------------------------------------------ */
  /* Genre filtering                                                          */
  /* ------------------------------------------------------------------------ */

  const availableGenres =
    useMemo<GenreOption[]>(() => {
      let baseList: GenreOption[];

      if (category === "movie") {
        baseList = MOVIE_GENRES;
      } else if (
        category === "tv" ||
        category === "kdrama"
      ) {
        baseList = TV_GENRES;
      } else {
        baseList = COMMON_GENRES;
      }

      const isIndianRegion =
        region ===
          "bollywood" ||
        region === "pollywood" ||
        region === "tollywood";

      if (
        isIndianRegion ||
        category === "kdrama" ||
        category === "anime"
      ) {
        return baseList.filter(
          (genreOption) => {
            const name =
              genreOption.name.toLowerCase();

            return (
              genreOption.id !==
                37 &&
              genreOption.id !==
                10763 &&
              !name.includes(
                "western",
              ) &&
              !name.includes(
                "news",
              )
            );
          },
        );
      }

      return baseList;
    }, [
      category,
      region,
    ]);

  /*
   * Keep the selected genre valid when
   * category/region changes.
   */
  const genre = useMemo(
    () => {
      if (
        selectedGenre ===
        "all"
      ) {
        return "all";
      }

      return availableGenres.some(
        (genreOption) =>
          String(
            genreOption.id,
          ) ===
          selectedGenre,
      )
        ? selectedGenre
        : "all";
    },
    [
      selectedGenre,
      availableGenres,
    ],
  );

  const genreOptions =
    useMemo(
      () =>
        availableGenres.map(
          (genreOption) => ({
            value: String(
              genreOption.id,
            ),
            label:
              genreOption.name,
          }),
        ),
      [availableGenres],
    );

  const showRegionFilter =
    category === "movie" ||
    category === "tv";

  /*
   * K-Drama and Anime already imply
   * their source region/language.
   */
  const effectiveRegion =
    showRegionFilter
      ? region
      : "all";

  /*
   * Stable key for all data belonging
   * to the current filter combination.
   */
  const filterKey =
    `${category}|${genre}|${effectiveRegion}`;

  /* ------------------------------------------------------------------------ */
  /* Result cache                                                             */
  /* ------------------------------------------------------------------------ */

  const [
    cache,
    setCache,
  ] = useState<{
    key: string;
    data: Record<
      number,
      ContentItem | null
    >;
  }>({
    key: filterKey,
    data: EMPTY_DATA,
  });

  const [
    limitState,
    setLimitState,
  ] = useState<{
    key: string;
    limit: number;
  }>({
    key: filterKey,
    limit:
      INITIAL_YEARS_COUNT,
  });

  const requested =
    useRef<{
      key: string;
      years: Set<number>;
    }>({
      key: filterKey,
      years: new Set(),
    });

  const controllerRef =
    useRef<{
      key: string;
      controller: AbortController;
    } | null>(null);

  const yearData =
    cache.key === filterKey
      ? cache.data
      : EMPTY_DATA;

  const scanLimit =
    limitState.key ===
    filterKey
      ? limitState.limit
      : INITIAL_YEARS_COUNT;

  const scannedYears =
    useMemo(
      () =>
        ALL_YEARS.slice(
          0,
          scanLimit,
        ),
      [scanLimit],
    );

  /* ------------------------------------------------------------------------ */
  /* Filter request lifecycle                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    /*
     * A new filter combination
     * gets a completely new request bucket.
     */
    if (
      requested.current.key !==
      filterKey
    ) {
      requested.current = {
        key: filterKey,
        years: new Set(),
      };
    }

    const bucket =
      requested.current;

    /*
     * Cancel requests belonging to
     * the previous filter set.
     */
    if (
      !controllerRef.current ||
      controllerRef.current.key !==
        filterKey
    ) {
      controllerRef.current?.controller.abort();

      controllerRef.current = {
        key: filterKey,
        controller:
          new AbortController(),
      };
    }

    const signal =
      controllerRef.current
        .controller.signal;

    scannedYears.forEach(
      (year) => {
        if (
          bucket.years.has(
            year,
          )
        ) {
          return;
        }

        bucket.years.add(year);

        void fetchBestOfYear(
          year,
          category,
          genre,
          effectiveRegion,
          signal,
        )
          .then((item) => {
            /*
             * Ignore responses from
             * previous filters.
             */
            if (
              requested.current !==
              bucket
            ) {
              return;
            }

            if (
              signal.aborted
            ) {
              return;
            }

            setCache(
              (previous) => ({
                key: filterKey,
                data: {
                  ...(previous.key ===
                  filterKey
                    ? previous.data
                    : {}),
                  [year]: item,
                },
              }),
            );
          })
          .catch((error) => {
            if (
              signal.aborted
            ) {
              return;
            }

            console.error(
              `[Recommendations] Failed to load ${year}:`,
              error,
            );

            /*
             * Mark failed requests as
             * null so they don't remain
             * indefinitely in loading state.
             */
            if (
              requested.current !==
              bucket
            ) {
              return;
            }

            setCache(
              (previous) => ({
                key: filterKey,
                data: {
                  ...(previous.key ===
                  filterKey
                    ? previous.data
                    : {}),
                  [year]: null,
                },
              }),
            );
          });
      },
    );
  }, [
    scannedYears,
    filterKey,
    category,
    genre,
    effectiveRegion,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Derived entries                                                          */
  /* ------------------------------------------------------------------------ */

  const entries =
    useMemo(
      () =>
        scannedYears
          .map((year) => ({
            year,
            item:
              yearData[year],
            isLoading:
              yearData[
                year
              ] === undefined,
          }))
          .filter(
            (entry) =>
              entry.isLoading ||
              entry.item !== null,
          ),
      [
        scannedYears,
        yearData,
      ],
    );

  const isAnyLoading =
    scannedYears.some(
      (year) =>
        yearData[year] ===
        undefined,
    );

  const canLoadMore =
    scanLimit <
    ALL_YEARS.length;

  const nextEndYear =
    ALL_YEARS[
      Math.min(
        scanLimit +
          STEP_YEARS_COUNT -
          1,
        ALL_YEARS.length - 1,
      )
    ];

  /* ------------------------------------------------------------------------ */
  /* Load more                                                                */
  /* ------------------------------------------------------------------------ */

  const loadMore =
    useCallback(() => {
      setLimitState({
        key: filterKey,
        limit: Math.min(
          scanLimit +
            STEP_YEARS_COUNT,
          ALL_YEARS.length,
        ),
      });
    }, [
      filterKey,
      scanLimit,
    ]);

  /* ------------------------------------------------------------------------ */
  /* Infinite loading                                                         */
  /* ------------------------------------------------------------------------ */

  const sentinelRef =
    useRef<HTMLDivElement>(
      null,
    );

  useEffect(() => {
    const element =
      sentinelRef.current;

    if (
      !element ||
      !canLoadMore
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry?.isIntersecting &&
            !isAnyLoading
          ) {
            loadMore();
          }
        },
        {
          rootMargin:
            "500px 0px",
        },
      );

    observer.observe(element);

    return () =>
      observer.disconnect();
  }, [
    canLoadMore,
    isAnyLoading,
    loadMore,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                 */
  /* ------------------------------------------------------------------------ */

  const hasActiveFilters =
    genre !== "all" ||
    effectiveRegion !==
      "all" ||
    category !== "movie";

  const handleResetFilters =
    useCallback(() => {
      setCategory("movie");
      setRegion("all");
      setSelectedGenre("all");
    }, []);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />

      <ScrollToTop />

      <main className="mx-auto w-full max-w-5xl flex-1 px-3.5 pb-28 sm:px-6 md:px-8 lg:px-10 lg:pb-16">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}

        <header className="pb-5 pt-6 sm:pt-10">
          <div className="mb-2 inline-flex items-center gap-2 text-primary">
            <Award
              className="h-4 w-4"
              aria-hidden="true"
            />

            <span className="text-xs font-bold uppercase tracking-widest sm:text-sm">
              Hall of Fame
            </span>
          </div>

          <h1 className="font-['Poppins'] text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Recommendations{" "}
            <span className="text-primary">
              {START_YEAR}
              &ndash;
              {END_YEAR}
            </span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            One top-rated pick for every
            year, newest first. Change a
            filter and the list updates.
          </p>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Sticky filters                                                    */}
        {/* ---------------------------------------------------------------- */}

        <div className="sticky top-0 z-30 -mx-3.5 border-y border-white/10 bg-background/80 px-3.5 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <FilterDropdown
              label="Format"
              value={category}
              onChange={(value) =>
                setCategory(
                  value as RecommendationCategory,
                )
              }
              options={
                FORMAT_DROPDOWN_OPTIONS
              }
              icon={
                <Clapperboard className="h-3.5 w-3.5" />
              }
            />

            {showRegionFilter ? (
              <FilterDropdown
                label="Region"
                value={region}
                onChange={(value) =>
                  setRegion(
                    value as RecommendationRegion,
                  )
                }
                options={
                  REGION_DROPDOWN_OPTIONS
                }
                icon={
                  <Globe className="h-3.5 w-3.5" />
                }
              />
            ) : (
              <div
                aria-label="Region"
                className="flex h-9 items-center rounded-xl border border-white/5 bg-white/[0.02] px-3 text-xs font-medium text-muted-foreground"
              >
                <Globe className="mr-1.5 h-3.5 w-3.5 shrink-0" />

                {category ===
                "kdrama"
                  ? "South Korea"
                  : "Japan"}
              </div>
            )}

            <div className="col-span-2 flex gap-2 sm:col-span-1">
              <FilterDropdown
                label="Genre"
                value={genre}
                onChange={
                  setSelectedGenre
                }
                options={
                  genreOptions
                }
                icon={
                  <Tags className="h-3.5 w-3.5" />
                }
              />

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={
                    handleResetFilters
                  }
                  aria-label="Reset filters"
                  title="Reset filters"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <RotateCcw
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Timeline                                                          */}
        {/* ---------------------------------------------------------------- */}

        <ol
          className="mt-6 sm:mt-8"
          aria-busy={isAnyLoading}
        >
          {entries.map(
            ({
              year,
              item,
              isLoading,
            }) => (
              <YearEntry
                key={year}
                year={year}
                item={item}
                isLoading={
                  isLoading
                }
              />
            ),
          )}
        </ol>

        {/* ---------------------------------------------------------------- */}
        {/* Empty state                                                       */}
        {/* ---------------------------------------------------------------- */}

        {!isAnyLoading &&
          !canLoadMore &&
          entries.length === 0 && (
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-14 text-center">
              <SlidersHorizontal className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />

              <h3 className="mb-1 text-base font-bold text-white">
                No titles match
                these filters
              </h3>

              <p className="mb-5 text-sm text-muted-foreground">
                Try a different
                genre or region,
                or reset to see
                all movies.
              </p>

              <Button
                size="sm"
                onClick={
                  handleResetFilters
                }
                className="rounded-xl bg-primary text-xs font-bold text-black hover:bg-primary/90"
              >
                Reset filters
              </Button>
            </div>
          )}

        {/* ---------------------------------------------------------------- */}
        {/* Load more                                                         */}
        {/* ---------------------------------------------------------------- */}

        {canLoadMore && (
          <div
            ref={sentinelRef}
            className="pt-2 text-center"
          >
            <Button
              size="sm"
              variant="outline"
              disabled={
                isAnyLoading
              }
              onClick={
                loadMore
              }
              className="h-9 rounded-xl border-white/15 bg-white/[0.04] px-5 text-xs font-semibold text-white hover:bg-white/[0.08]"
            >
              {isAnyLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 motion-safe:animate-spin" />
                  Loading years
                </>
              ) : (
                <>
                  Load years down to{" "}
                  {nextEndYear}

                  <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Checked{" "}
              {scanLimit} of{" "}
              {ALL_YEARS.length}{" "}
              years
            </p>
          </div>
        )}
      </main>
    </div>
  );
}