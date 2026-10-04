import { supabase } from "./supabase";
import {
  addCollectionItem,
  type CollectionMediaType,
} from "./collectionStore";
import { getCatalogState, setCatalogState } from "./catalogStore";
import { showSuccess } from "@/utils/toast";

export interface AuthRedirectParams {
  returnTo: string;
  action?: "add_collection" | string | null;
  movieId?: number | null;
  mediaType?: string | null;
  title?: string | null;
  posterPath?: string | null;
  releaseDate?: string | null;
  voteAverage?: number | null;
}

const MEDIA_TYPES: CollectionMediaType[] = [
  "movie",
  "tv",
  "anime",
  "k-drama",
];

const isCollectionMediaType = (
  value: string | null | undefined,
): value is CollectionMediaType => MEDIA_TYPES.includes(value as CollectionMediaType);

export const sanitizeReturnTo = (
  value: string | null | undefined,
): string => {
  if (!value) return "/";

  const path = value.trim();

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\") ||
    path.includes("://")
  ) {
    return "/";
  }

  return path;
};

export const parseAuthRedirectParams = (
  search: string | URLSearchParams,
): AuthRedirectParams => {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;

  const movieIdValue = Number.parseInt(params.get("movie_id") ?? "", 10);
  const voteAverageValue = Number.parseFloat(
    params.get("vote_average") ?? "",
  );

  return {
    returnTo: sanitizeReturnTo(params.get("return_to")),
    action: params.get("action"),
    movieId: Number.isFinite(movieIdValue) ? movieIdValue : null,
    mediaType: params.get("media_type"),
    title: params.get("title"),
    posterPath: params.get("poster_path"),
    releaseDate: params.get("release_date"),
    voteAverage: Number.isFinite(voteAverageValue) ? voteAverageValue : 0,
  };
};

export const handlePostLoginRedirect = async (
  search: string | URLSearchParams,
  userId: string,
): Promise<string> => {
  const {
    returnTo,
    action,
    movieId,
    mediaType,
    title,
    posterPath,
    releaseDate,
    voteAverage,
  } = parseAuthRedirectParams(search);

  if (action !== "add_collection" || !movieId || !userId) {
    return returnTo;
  }

  try {
    let finalTitle = title?.trim() || "";
    let finalPoster = posterPath || "";
    let finalRelease = releaseDate || "";
    let finalVote = voteAverage ?? 0;
    let finalType: CollectionMediaType = isCollectionMediaType(mediaType)
      ? mediaType
      : "movie";

    if (!finalTitle) {
      try {
        const { fetchFromProxy } = await import("./tmdb/client");

        const data = await fetchFromProxy<{
          title?: string;
          name?: string;
          poster_path?: string;
          release_date?: string;
          first_air_date?: string;
          vote_average?: number;
        }>(`/movie/${movieId}`).catch(() =>
          fetchFromProxy<{
            title?: string;
            name?: string;
            poster_path?: string;
            release_date?: string;
            first_air_date?: string;
            vote_average?: number;
          }>(`/tv/${movieId}`),
        );

        finalTitle = data.title || data.name || `Title #${movieId}`;
        finalPoster = data.poster_path
          ? `https://image.tmdb.org/t/p/w342${data.poster_path}`
          : "";
        finalRelease = data.release_date || data.first_air_date || "";
        finalVote = data.vote_average ?? 0;

        if (!isCollectionMediaType(mediaType)) {
          finalType = data.title ? "movie" : "tv";
        }
      } catch (error) {
        console.warn(
          "[authRedirect] Failed to fetch fallback content details:",
          error,
        );
      }
    }

    if (!finalTitle) return returnTo;

    const newItem = {
      user_id: userId,
      content_id: movieId,
      title: finalTitle,
      poster_path: finalPoster,
      release_date: finalRelease,
      vote_average: finalVote,
      media_type: finalType,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("watched_content")
      .upsert(newItem, {
        onConflict: "user_id,content_id",
      });

    if (error) {
      console.error(
        "[authRedirect] Failed to add collection item:",
        error.message,
      );
      return returnTo;
    }

    addCollectionItem(newItem);

    const { watchedIds } = getCatalogState();

    if (!watchedIds.includes(movieId)) {
      setCatalogState({
        watchedIds: [...watchedIds, movieId],
      });
    }

    showSuccess(`Added "${finalTitle}" to your collection!`);
  } catch (error) {
    console.error(
      "[authRedirect] Failed to complete post-login action:",
      error,
    );
  }

  return returnTo;
};