import {
  ContentItem,
  MediaType,
  Region,
  TMDBCombinedCredits,
  TMDBListItem,
  TMDBListResponse,
  TMDBVideo,
} from "./types";

import {
  ACTIVITY_THRESHOLD,
  fetchFromProxy,
  getActivityScore,
} from "./client";

import { getRegionParams } from "./regions";

import {
  interleave,
  mapResults,
  sortYearContent,
  uniqueById,
} from "./mappers";

/* -------------------------------------------------------------------------- */
/* Shared types/helpers                                                       */
/* -------------------------------------------------------------------------- */

type Params = Record<
  string,
  string | number | boolean | undefined
>;

type TMDBList = TMDBListResponse<TMDBListItem>;

const VIDEO_LANGS =
  "en,hi,te,ta,kn,ml,pa,ko,ja,null";

const INDIAN_LANGS =
  "hi|te|ta|kn|ml";

const INDIAN_LANGS_WITH_PA =
  `${INDIAN_LANGS}|pa`;

const ANIME_KEYWORD = "210024";

const todayISO = (): string =>
  new Date().toISOString().split("T")[0];

/** Anime and K-drama are TV content from TMDB's perspective. */
const kindOf = (
  type: MediaType,
): "movie" | "tv" =>
  type === "movie" ? "movie" : "tv";

const discoverPath = (
  type: MediaType,
): string =>
  `/discover/${kindOf(type)}`;

const DATE_KEYS = {
  movie: {
    year: "primary_release_year",
    gte: "primary_release_date.gte",
    lte: "primary_release_date.lte",
    asc: "primary_release_date.asc",
  },
  tv: {
    year: "first_air_date_year",
    gte: "first_air_date.gte",
    lte: "first_air_date.lte",
    asc: "first_air_date.asc",
  },
} as const;

const isReleased = (
  item: ContentItem,
  today: string,
): boolean =>
  !item.release_date ||
  item.release_date === "TBA" ||
  item.release_date <= today;

const timeOf = (
  item: ContentItem,
): number => {
  if (
    !item.release_date ||
    item.release_date === "TBA"
  ) {
    return 0;
  }

  const timestamp = Date.parse(
    item.release_date,
  );

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
};

/**
 * Prevent one failed secondary request from breaking
 * an entire page.
 */
const safe = async <T>(
  promise: Promise<T>,
  fallback: T,
): Promise<T> => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

/**
 * Apply media-specific TMDB filters.
 */
function applyTypeFilters(
  params: Params,
  type: MediaType,
): Params {
  const result = { ...params };

  switch (type) {
    case "tv":
      result.without_original_language =
        "ko|ja";
      break;

    case "anime":
      delete result.without_original_language;

      result.with_keywords =
        ANIME_KEYWORD;

      result.with_original_language =
        "ja";
      break;

    case "k-drama":
      delete result.without_original_language;

      result.with_original_language =
        "ko";
      break;

    default:
      break;
  }

  return result;
}

/**
 * "All regions" uses Hollywood/international and
 * Indian content together, then interleaves them.
 */
async function fetchMixedDiscover(
  type: MediaType,
  params: Params,
): Promise<ContentItem[]> {
  const path = discoverPath(type);

  const [hollywood, indian] =
    await Promise.all([
      fetchFromProxy<TMDBList>(
        path,
        {
          ...params,
          ...getRegionParams(
            "hollywood",
          ),
        },
      ),

      fetchFromProxy<TMDBList>(
        path,
        {
          ...params,
          region: "IN",
          with_original_language:
            INDIAN_LANGS_WITH_PA,
        },
      ),
    ]);

  return interleave(
    mapResults(
      hollywood.results ?? [],
      type,
    ),
    mapResults(
      indian.results ?? [],
      type,
    ),
  );
}

const onlyTv = (
  items: ContentItem[],
  type: MediaType,
): ContentItem[] =>
  type === "tv"
    ? items.filter(
        (item) =>
          item.media_type === "tv",
      )
    : items;

/* -------------------------------------------------------------------------- */
/* Trending                                                                   */
/* -------------------------------------------------------------------------- */

export const fetchTrending =
  async (): Promise<ContentItem[]> => {
    const today = todayISO();

    const [
      globalMovies,
      indianMovies,
      globalTv,
      anime,
      kdrama,
    ] = await Promise.all([
      safe(
        fetchFromProxy<TMDBList>(
          "/trending/movie/day",
        ),
        { page: 1, results: [], total_pages: 0, total_results: 0 },
      ),

      safe(
        fetchFromProxy<TMDBList>(
          "/discover/movie",
          {
            region: "IN",
            with_original_language:
              INDIAN_LANGS,
            sort_by:
              "popularity.desc",
            include_adult: false,
          },
        ),
        { page: 1, results: [], total_pages: 0, total_results: 0 },
      ),

      safe(
        fetchFromProxy<TMDBList>(
          "/trending/tv/day",
          {
            without_original_language:
              "ja|ko",
          },
        ),
        { page: 1, results: [], total_pages: 0, total_results: 0 },
      ),

      safe(
        fetchFromProxy<TMDBList>(
          "/discover/tv",
          {
            with_keywords:
              ANIME_KEYWORD,
            with_original_language:
              "ja",
            sort_by:
              "popularity.desc",
            include_adult: false,
          },
        ),
        { page: 1, results: [], total_pages: 0, total_results: 0 },
      ),

      safe(
        fetchFromProxy<TMDBList>(
          "/discover/tv",
          {
            with_original_language:
              "ko",
            sort_by:
              "popularity.desc",
            include_adult: false,
          },
        ),
        { page: 1, results: [], total_pages: 0, total_results: 0 },
      ),
    ]);

    const combined = interleave(
      mapResults(
        globalMovies.results,
        "movie",
      ),

      mapResults(
        indianMovies.results,
        "movie",
      ),

      mapResults(
        globalTv.results,
        "tv",
      ).filter(
        (item) =>
          item.media_type === "tv",
      ),

      mapResults(
        anime.results,
        "anime",
      ),

      mapResults(
        kdrama.results,
        "k-drama",
      ),
    ).filter((item) =>
      isReleased(item, today),
    );

    return uniqueById(combined).slice(
      0,
      12,
    );
  };

/* -------------------------------------------------------------------------- */
/* Trailers                                                                   */
/* -------------------------------------------------------------------------- */

const videoRank = (
  video: TMDBVideo,
): number => {
  if (video.type === "Trailer") {
    return video.official ? 0 : 1;
  }

  if (
    video.type === "Teaser" ||
    video.type === "Clip" ||
    video.type === "Featurette"
  ) {
    return 2;
  }

  return 3;
};

const bestYouTubeKey = (
  videos: TMDBVideo[],
): string | null => {
  let best: TMDBVideo | null = null;

  for (const video of videos) {
    if (
      video.site !== "YouTube" ||
      !video.key
    ) {
      continue;
    }

    if (
      !best ||
      videoRank(video) <
        videoRank(best)
    ) {
      best = video;
    }
  }

  return best?.key ?? null;
};

export const fetchTrailers = async (
  id: number,
  type: MediaType,
  _title?: string,
): Promise<string | null> => {
  const primary = kindOf(type);
  const alternate =
    primary === "movie"
      ? "tv"
      : "movie";

  const embed = (
    key: string,
  ): string =>
    `https://www.youtube.com/embed/${key}`;

  try {
    const primaryData =
      await fetchFromProxy<{
        results: TMDBVideo[];
      }>(
        `/${primary}/${id}/videos`,
        {
          include_video_language:
            VIDEO_LANGS,
        },
      );

    const primaryKey =
      bestYouTubeKey(
        primaryData.results ?? [],
      );

    if (primaryKey) {
      return embed(primaryKey);
    }

    /*
     * Some TMDB records are available under the
     * opposite media endpoint.
     */
    const alternateData =
      await safe(
        fetchFromProxy<{
          results: TMDBVideo[];
        }>(
          `/${alternate}/${id}/videos`,
          {
            include_video_language:
              VIDEO_LANGS,
          },
        ),
        null,
      );

    const alternateKey =
      bestYouTubeKey(
        alternateData?.results ?? [],
      );

    return alternateKey
      ? embed(alternateKey)
      : null;
  } catch (error) {
    console.warn(
      "[tmdb] Error fetching trailer:",
      error,
    );

    return null;
  }
};

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

async function searchContent(
  query: string,
  page: number,
  type: MediaType,
): Promise<ContentItem[]> {
  const normalizedQuery =
    query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const [
    multiData,
    personData,
  ] = await Promise.all([
    fetchFromProxy<TMDBList>(
      "/search/multi",
      {
        query: normalizedQuery,
        page,
        include_adult: false,
      },
    ),

    safe(
      fetchFromProxy<TMDBList>(
        "/search/person",
        {
          query: normalizedQuery,
          include_adult: false,
        },
      ),
      {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      },
    ),
  ]);

  let results: TMDBListItem[] = [
    ...multiData.results,
  ];

  const personId =
    personData.results[0]?.id;

  if (personId) {
    const credits =
      await safe(
        fetchFromProxy<TMDBCombinedCredits>(
          `/person/${personId}/combined_credits`,
          {
            include_adult: false,
          },
        ),
        null,
      );

    if (credits) {
      results = [
        ...results,
        ...credits.cast,
        ...credits.crew.filter(
          (credit) =>
            credit.job === "Director",
        ),
      ];
    }
  }

  const normalizedQueryLower =
    normalizedQuery.toLowerCase();

  return uniqueById(
    mapResults(results, type),
  )
    .map((item) => ({
      item,
      exact:
        item.title.toLowerCase() ===
        normalizedQueryLower,
      time: timeOf(item),
    }))
    .sort(
      (a, b) =>
        Number(b.exact) -
          Number(a.exact) ||
        b.time - a.time ||
        b.item.popularity -
          a.item.popularity,
    )
    .map(({ item }) => item);
}

/* -------------------------------------------------------------------------- */
/* Browse / Discover                                                          */
/* -------------------------------------------------------------------------- */

const FUTURE_YEAR_VARIANTS = (
  keys:
    (typeof DATE_KEYS)[
      "movie" | "tv"
    ],
  year: number,
): Params[] => [
  {
    [keys.year]: year,
  },

  {
    sort_by: keys.asc,
    [keys.year]: year,
  },

  {
    [keys.gte]: `${year}-01-01`,
  },

  {
    sort_by: keys.asc,
    [keys.gte]: `${year}-01-01`,
  },
];

export const fetchContent = async (
  type: MediaType,
  year?: number,
  page = 1,
  query = "",
  region: Region = "all",
): Promise<ContentItem[]> => {
  if (query.trim()) {
    return searchContent(
      query,
      page,
      type,
    );
  }

  const today = todayISO();
  const currentYear =
    new Date().getFullYear();

  const targetYear =
    year ?? currentYear;

  const isFutureYear =
    targetYear > currentYear;

  const keys =
    DATE_KEYS[kindOf(type)];

  const baseParams: Params = {
    page,
    include_adult: false,
    sort_by: "popularity.desc",
  };

  if (!isFutureYear) {
    baseParams[keys.year] =
      targetYear;

    baseParams[keys.lte] =
      today;
  }

  if (type === "tv") {
    baseParams.without_original_language =
      "ko|ja";
  }

  let items: ContentItem[];

  if (
    !isFutureYear &&
    region === "all" &&
    (type === "movie" ||
      type === "tv")
  ) {
    items = sortYearContent(
      uniqueById(
        await fetchMixedDiscover(
          type,
          baseParams,
        ),
      ),
    );
  } else {
    const path =
      discoverPath(type);

    const params =
      applyTypeFilters(
        {
          ...baseParams,
          ...getRegionParams(region),
        },
        type,
      );

    if (isFutureYear) {
      const responses =
        await Promise.all(
          FUTURE_YEAR_VARIANTS(
            keys,
            targetYear,
          ).map((variant) =>
            fetchFromProxy<TMDBList>(
              path,
              {
                ...params,
                ...variant,
              },
            ),
          ),
        );

      const results =
        responses.flatMap(
          (response) =>
            response.results,
        );

      items = uniqueById(
        mapResults(
          results,
          type,
        ),
      );
    } else {
      const data =
        await fetchFromProxy<TMDBList>(
          path,
          params,
        );

      items = sortYearContent(
        uniqueById(
          mapResults(
            data.results,
            type,
          ),
        ),
      );
    }
  }

  if (!isFutureYear) {
    items = items.filter(
      (item) =>
        isReleased(item, today),
    );
  }

  return onlyTv(items, type);
};

/* -------------------------------------------------------------------------- */
/* Credits                                                                    */
/* -------------------------------------------------------------------------- */

export interface ContentCredits {
  director?: string;
  cast: string[];
}

interface TMDBCredit {
  name?: string;
  job?: string;
}

interface TMDBCreditsResponse {
  cast?: TMDBCredit[];
  crew?: TMDBCredit[];
}

export const fetchCredits = async (
  id: number,
  type: "movie" | "tv",
): Promise<ContentCredits> => {
  const data =
    await fetchFromProxy<TMDBCreditsResponse>(
      `/${type}/${id}/credits`,
    );

  const director =
    data.crew?.find(
      (credit) =>
        credit.job === "Director",
    )?.name;

  const cast =
    data.cast
      ?.map(
        (credit) => credit.name,
      )
      .filter(
        (name): name is string =>
          Boolean(name),
      )
      .slice(0, 5) ?? [];

  return {
    director,
    cast,
  };
};

/* -------------------------------------------------------------------------- */
/* Upcoming                                                                    */
/* -------------------------------------------------------------------------- */

export const fetchUpcoming =
  async (
    type: MediaType = "movie",
    region: Region = "all",
    page = 1,
  ): Promise<ContentItem[]> => {
    const keys =
      DATE_KEYS[kindOf(type)];

    const baseParams: Params = {
      page,
      include_adult: false,
      sort_by: keys.asc,
      [keys.gte]: todayISO(),
    };

    if (
      region === "all" &&
      (type === "movie" ||
        type === "tv")
    ) {
      const withTv =
        type === "tv"
          ? {
              ...baseParams,
              without_original_language:
                "ko|ja",
            }
          : baseParams;

      return onlyTv(
        uniqueById(
          await fetchMixedDiscover(
            type,
            withTv,
          ),
        ),
        type,
      );
    }

    const params =
      applyTypeFilters(
        {
          ...baseParams,
          ...getRegionParams(region),
        },
        type,
      );

    const data =
      await fetchFromProxy<TMDBList>(
        discoverPath(type),
        params,
      );

    return onlyTv(
      uniqueById(
        mapResults(
          data.results,
          type,
        ),
      ),
      type,
    );
  };

/* -------------------------------------------------------------------------- */
/* Smart cache warming                                                        */
/* -------------------------------------------------------------------------- */

export const smartWarmCache =
  async (): Promise<void> => {
    if (
      typeof navigator ===
      "undefined"
    ) {
      return;
    }

    const connection =
      (
        navigator as Navigator & {
          connection?: {
            saveData?: boolean;
            effectiveType?: string;
          };
        }
      ).connection;

    if (
      connection?.saveData ||
      connection?.effectiveType ===
        "2g"
    ) {
      return;
    }

    if (
      getActivityScore() <
      ACTIVITY_THRESHOLD
    ) {
      return;
    }

    try {
      await Promise.all([
        fetchContent(
          "movie",
          new Date().getFullYear(),
        ),
        fetchUpcoming("movie"),
      ]);
    } catch (error) {
      console.warn(
        "[tmdb] Smart warming failed:",
        error,
      );
    }
  };

/* -------------------------------------------------------------------------- */
/* Best of Year                                                               */
/* -------------------------------------------------------------------------- */

export type BestOfCategory =
  | "movie"
  | "tv"
  | "all"
  | "kdrama"
  | "anime";

export type BestOfRegion =
  | "all"
  | "hollywood"
  | "bollywood"
  | "pollywood"
  | "tollywood";

const BEST_OF_REGION_LANG: Record<
  Exclude<BestOfRegion, "all">,
  string
> = {
  hollywood: "en",
  bollywood: "hi",
  pollywood: "pa",
  tollywood: "te",
};

const baseMinVotes = (
  year: number,
  currentYear: number,
): number => {
  if (year < 1980) return 80;
  if (year < 2000) return 200;
  if (year < 2020) return 350;
  if (year <= currentYear) return 150;

  return 0;
};

export function getBestOfYearConfig(
  year: number,
  category: BestOfCategory = "all",
  genreId?: number | string,
  region: BestOfRegion = "all",
) {
  const currentYear =
    new Date().getFullYear();

  const isFuture =
    year > currentYear;

  const hasGenre =
    genreId !== undefined &&
    genreId !== null &&
    genreId !== "" &&
    genreId !== "all";

  const regionParams: Params = {};

  if (
    (
      category === "movie" ||
      category === "tv" ||
      category === "all"
    ) &&
    region !== "all"
  ) {
    regionParams.with_original_language =
      BEST_OF_REGION_LANG[region];
  }

  let minVotes =
    baseMinVotes(
      year,
      currentYear,
    );

  if (
    region !== "all" &&
    region !== "hollywood"
  ) {
    minVotes = Math.max(
      5,
      Math.floor(minVotes / 8),
    );
  } else if (
    category === "kdrama" ||
    category === "anime"
  ) {
    minVotes = Math.max(
      10,
      Math.floor(minVotes / 5),
    );
  }

  if (hasGenre) {
    minVotes = Math.max(
      10,
      Math.floor(minVotes / 3),
    );
  }

  const sortBy = isFuture
    ? "popularity.desc"
    : "vote_average.desc";

  return {
    isFuture,
    hasGenre,
    regionParams,
    minVotes,
    sortBy,
  };
}

type BestOfConfig =
  ReturnType<
    typeof getBestOfYearConfig
  >;

/* -------------------------------------------------------------------------- */
/* Genre mapping                                                              */
/* -------------------------------------------------------------------------- */

const MOVIE_TO_TV: Record<
  string,
  string
> = {
  "28": "10759",
  "12": "10759",
  "14": "10765",
  "878": "10765",
  "10752": "10768",
};

const TV_TO_MOVIE: Record<
  string,
  string[]
> = {
  "10759": ["28", "12"],
  "10765": ["14", "878"],
  "10768": ["10752"],
};

const MOVIE_ONLY = new Set([
  "27",
  "10749",
  "53",
  "36",
  "10402",
  "10770",
]);

const TV_ONLY = new Set([
  "10762",
  "10763",
  "10764",
  "10766",
  "10767",
]);

export function genreForKind(
  kind: "movie" | "tv",
  id: number | string,
): string | null {
  const genre =
    String(id);

  if (kind === "tv") {
    if (MOVIE_ONLY.has(genre)) {
      return null;
    }

    return (
      MOVIE_TO_TV[genre] ??
      genre
    );
  }

  if (TV_ONLY.has(genre)) {
    return null;
  }

  return (
    TV_TO_MOVIE[genre]?.[0] ??
    genre
  );
}

/* -------------------------------------------------------------------------- */
/* Best-of helpers                                                            */
/* -------------------------------------------------------------------------- */

async function fetchTopOne(
  kind: "movie" | "tv",
  year: number,
  config: BestOfConfig,
  genreId:
    | number
    | string
    | undefined,
  extra: Params = {},
  animation = false,
): Promise<ContentItem | null> {
  const params: Params = {
    [DATE_KEYS[kind].year]:
      year,

    include_adult: false,

    sort_by:
      config.sortBy,

    page: 1,

    ...extra,
  };

  if (config.hasGenre) {
    const genre =
      genreForKind(
        kind,
        genreId as
          | number
          | string,
      );

    if (genre === null) {
      return null;
    }

    params.with_genres =
      animation
        ? `16,${genre}`
        : genre;
  } else if (animation) {
    params.with_genres = "16";
  }

  if (
    !config.isFuture &&
    config.minVotes > 0
  ) {
    params["vote_count.gte"] =
      kind === "movie"
        ? config.minVotes
        : Math.floor(
            config.minVotes / 2,
          );
  }

  const data =
    await fetchFromProxy<TMDBList>(
      `/discover/${kind}`,
      params,
    );

  return (
    mapResults(
      data.results,
      kind,
    )[0] ?? null
  );
}

const pickBetter = (
  movie: ContentItem | null,
  tv: ContentItem | null,
  movieWins: (
    movie: ContentItem,
    tv: ContentItem,
  ) => boolean,
): ContentItem | null => {
  if (!movie) return tv;
  if (!tv) return movie;

  return movieWins(movie, tv)
    ? movie
    : tv;
};

const byRating = (
  movie: ContentItem,
  tv: ContentItem,
): boolean =>
  movie.vote_average >=
  tv.vote_average;

const byVotes = (
  movie: ContentItem,
  tv: ContentItem,
): boolean =>
  movie.vote_count >=
  tv.vote_count;

const blendedScore = (
  item: ContentItem,
): number =>
  item.vote_average * 1000 +
  Math.min(
    item.vote_count,
    5000,
  );

const byBlendedScore = (
  movie: ContentItem,
  tv: ContentItem,
): boolean =>
  blendedScore(movie) >=
  blendedScore(tv);

/* -------------------------------------------------------------------------- */
/* Concurrency limiter                                                        */
/* -------------------------------------------------------------------------- */

function createLimiter(
  max: number,
) {
  let active = 0;

  const queue: Array<
    () => void
  > = [];

  const pump = (): void => {
    while (
      active < max &&
      queue.length > 0
    ) {
      active += 1;

      const next =
        queue.shift();

      next?.();
    }
  };

  return function limit<T>(
    task: () => Promise<T>,
  ): Promise<T> {
    return new Promise<T>(
      (resolve, reject) => {
        queue.push(() => {
          task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
              active -= 1;
              pump();
            });
        });

        pump();
      },
    );
  };
}

const bestOfLimit =
  createLimiter(4);

/* -------------------------------------------------------------------------- */
/* Best-of loader                                                             */
/* -------------------------------------------------------------------------- */

async function loadBestOfYear(
  year: number,
  category: BestOfCategory,
  genreId:
    | number
    | string
    | undefined,
  region: BestOfRegion,
): Promise<ContentItem | null> {
  const config =
    getBestOfYearConfig(
      year,
      category,
      genreId,
      region,
    );

  try {
    switch (category) {
      case "kdrama":
        return fetchTopOne(
          "tv",
          year,
          config,
          genreId,
          {
            ...config.regionParams,
            with_original_language:
              "ko",
          },
        );

      case "anime": {
        const [
          movie,
          tv,
        ] = await Promise.all([
          fetchTopOne(
            "movie",
            year,
            config,
            genreId,
            {
              with_original_language:
                "ja",
            },
            true,
          ),

          fetchTopOne(
            "tv",
            year,
            config,
            genreId,
            {
              with_original_language:
                "ja",
            },
            true,
          ),
        ]);

        return pickBetter(
          movie,
          tv,
          byRating,
        );
      }

      case "movie":
        return fetchTopOne(
          "movie",
          year,
          config,
          genreId,
          config.regionParams,
        );

      case "tv":
        return fetchTopOne(
          "tv",
          year,
          config,
          genreId,
          config.regionParams,
        );

      case "all":
      default: {
        const [
          movie,
          tv,
        ] = await Promise.all([
          fetchTopOne(
            "movie",
            year,
            config,
            genreId,
            config.regionParams,
          ),

          fetchTopOne(
            "tv",
            year,
            config,
            genreId,
            config.regionParams,
          ),
        ]);

        return pickBetter(
          movie,
          tv,
          config.isFuture
            ? byVotes
            : byBlendedScore,
        );
      }
    }
  } catch (error) {
    console.error(
      `Failed to fetch best of year ${year}:`,
      error,
    );

    return null;
  }
}


export const fetchBestOfYear = (
  year: number,
  category: BestOfCategory = "all",
  genreId?:
    | number
    | string,
  region: BestOfRegion = "all",
  signal?: AbortSignal,
): Promise<ContentItem | null> =>
  bestOfLimit(async () => {
    if (signal?.aborted) {
      return null;
    }

    return loadBestOfYear(
      year,
      category,
      genreId,
      region,
    );
  });