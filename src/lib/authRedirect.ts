import { supabase } from './supabase';
import { addCollectionItem } from './collectionStore';
import { setCatalogState, getCatalogState } from './catalogStore';
import { showSuccess } from '@/utils/toast';

export interface AuthRedirectParams {
  returnTo: string;
  action?: 'add_collection' | string | null;
  movieId?: number | null;
  mediaType?: string | null;
  title?: string | null;
  posterPath?: string | null;
  releaseDate?: string | null;
  voteAverage?: number | null;
}

/**
 * Validates return_to before redirecting.
 * Only allows internal paths (starting with "/" and not "//" or "/\").
 * Never allows external URLs or protocol-relative paths to prevent open-redirect vulnerabilities.
 */
export const sanitizeReturnTo = (url: string | null | undefined): string => {
  if (!url) return '/';
  const trimmed = url.trim();

  // Must start with exactly one forward slash, not protocol-relative (//) or Windows path (/\)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '/';
  }

  // Reject anything containing scheme delimiters
  if (trimmed.includes('://')) {
    return '/';
  }

  return trimmed;
};

/**
 * Parses URL query parameters for return_to, action, and movie_id.
 */
export const parseAuthRedirectParams = (search: string | URLSearchParams): AuthRedirectParams => {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const rawReturnTo = params.get('return_to');
  const returnTo = sanitizeReturnTo(rawReturnTo);
  const action = params.get('action');
  const movieIdRaw = params.get('movie_id');
  const movieId = movieIdRaw ? parseInt(movieIdRaw, 10) : null;
  const mediaType = params.get('media_type');
  const title = params.get('title');
  const posterPath = params.get('poster_path');
  const releaseDate = params.get('release_date');
  const voteAverageRaw = params.get('vote_average');
  const voteAverage = voteAverageRaw ? parseFloat(voteAverageRaw) : 0;

  return {
    returnTo,
    action,
    movieId: Number.isNaN(movieId) ? null : movieId,
    mediaType,
    title,
    posterPath,
    releaseDate,
    voteAverage: Number.isNaN(voteAverage) ? 0 : voteAverage,
  };
};

/**
 * Shared function executed after successful login:
 * Reads parameters, executes post-login actions (like add_collection),
 * and returns the validated returnTo path.
 */
export const handlePostLoginRedirect = async (
  search: string | URLSearchParams,
  userId: string
): Promise<string> => {
  const { returnTo, action, movieId, mediaType, title, posterPath, releaseDate, voteAverage } =
    parseAuthRedirectParams(search);

  if (action === 'add_collection' && movieId && userId) {
    try {
      let finalTitle = title;
      let finalPoster = posterPath || '';
      let finalRelease = releaseDate || '';
      let finalVote = voteAverage || 0;
      let finalType = mediaType || 'movie';

      // Fallback: If title was not passed in params, fetch minimal details via proxy
      if (!finalTitle) {
        try {
          const { fetchFromProxy } = await import('./tmdb/client');
          const data = await fetchFromProxy(`/movie/${movieId}`).catch(() =>
            fetchFromProxy(`/tv/${movieId}`).catch(() => null)
          );
          if (data) {
            finalTitle = data.title || data.name || `Title #${movieId}`;
            finalPoster = data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : '';
            finalRelease = data.release_date || data.first_air_date || '';
            finalVote = data.vote_average || 0;
            finalType = data.title ? 'movie' : 'tv';
          }
        } catch (err) {
          console.warn("[authRedirect] Could not fetch fallback details for movie_id:", movieId, err);
        }
      }

      if (finalTitle) {
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
          .from('watched_content')
          .upsert(newItem, { onConflict: 'user_id,content_id' });

        if (!error) {
          addCollectionItem(newItem);
          const currentCatalog = getCatalogState();
          if (!currentCatalog.watchedIds.includes(movieId)) {
            setCatalogState({
              watchedIds: [...currentCatalog.watchedIds, movieId],
            });
          }
          showSuccess(`Added "${finalTitle}" to your collection!`);
        }
      }
    } catch (err) {
      console.error("[authRedirect] Error automatically adding to collection:", err);
    }
  }

  return returnTo;
};