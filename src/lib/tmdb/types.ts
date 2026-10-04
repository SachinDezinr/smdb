export type MediaType = "movie" | "tv" | "anime" | "k-drama";

export type Region =
  | "all"
  | "hollywood"
  | "bollywood"
  | "punjabi"
  | "south-indian"
  | "animated"
  | "international"
  | "korean"
  | "indian";

export type TMDBMediaKind = "movie" | "tv";

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBVideo {
  id?: string;
  key?: string;
  name?: string;
  site?: string;
  type?: string;
  official?: boolean;
  published_at?: string;
}

export interface TMDBVideoResponse {
  results: TMDBVideo[];
}

export interface TMDBSeason {
  id?: number;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  season_number: number;
  episode_count?: number;
  air_date?: string | null;
  vote_average?: number;
}

export interface ContentItem {
  /** TMDB content ID */
  id: number;

  /** Normalized title used throughout the UI */
  title: string;

  /** TMDB poster URL, not the raw TMDB path */
  poster_path: string;

  /** TMDB backdrop URL */
  backdrop_path?: string;

  /** YYYY-MM-DD or TBA */
  release_date: string;

  /** TMDB rating from 0–10 */
  vote_average: number;

  /** Number of TMDB votes */
  vote_count: number;

  /** Normalized SMDB media type */
  media_type: MediaType;

  /** TMDB genre IDs */
  genre_ids: number[];

  /** Short/long description */
  overview: string;

  /** TMDB popularity score */
  popularity: number;

  /** Whether TMDB marks the title as adult content */
  adult: boolean;

  /** Original language, e.g. en, hi, ja, ko */
  original_language?: string;

  /** Countries associated with the title */
  origin_country?: string[];

  /** Normalized video response */
  videos?: TMDBVideoResponse;

  /** Number of released seasons for TV content */
  season_count?: number;

  /** Optional TMDB genre objects from detail responses */
  genres?: TMDBGenre[];

  /** Optional seasons from TV detail responses */
  seasons?: TMDBSeason[];
}

/**
 * Raw TMDB list result.
 *
 * This represents the shape returned by /discover, /search,
 * /trending and similar endpoints before normalization.
 */
export interface TMDBListItem {
  id: number;

  title?: string;
  name?: string;

  poster_path?: string | null;
  backdrop_path?: string | null;

  release_date?: string;
  first_air_date?: string;

  vote_average?: number;
  vote_count?: number;
  popularity?: number;

  overview?: string;

  adult?: boolean;

  media_type?: TMDBMediaKind;

  genre_ids?: number[];

  original_language?: string;
  origin_country?: string[];

  video?: boolean;

  videos?: TMDBVideoResponse;

  genres?: TMDBGenre[];

  seasons?: TMDBSeason[];
  number_of_seasons?: number;
}

/**
 * Generic TMDB paginated response.
 */
export interface TMDBListResponse<T = TMDBListItem> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

/**
 * TMDB person credit used by search/credit queries.
 */
export interface TMDBPersonCredit {
  id: number;

  title?: string;
  name?: string;

  media_type?: TMDBMediaKind;

  character?: string;
  job?: string;
  department?: string;

  poster_path?: string | null;
  backdrop_path?: string | null;

  release_date?: string;
  first_air_date?: string;

  vote_average?: number;
  vote_count?: number;
  popularity?: number;

  overview?: string;

  adult?: boolean;

  genre_ids?: number[];

  original_language?: string;
  origin_country?: string[];
}

export interface TMDBCombinedCredits {
  cast: TMDBPersonCredit[];
  crew: TMDBPersonCredit[];
}

/**
 * Credits normalized for SMDB's ContentCard.
 */
export interface ContentCredits {
  director?: string;
  cast: string[];
}

/**
 * Configuration used when requesting content.
 */
export interface ContentQueryOptions {
  page?: number;
  year?: number;
  query?: string;
  region?: Region;
  genreId?: number | string;
  signal?: AbortSignal;
}

/**
 * Values accepted by TMDB discover endpoints.
 */
export type TMDBQueryValue =
  | string
  | number
  | boolean
  | undefined;

export type TMDBQueryParams = Record<string, TMDBQueryValue>;