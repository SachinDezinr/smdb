import { supabase } from "./supabase";

export type CollectionMediaType =
  | "movie"
  | "tv"
  | "anime"
  | "k-drama";

export interface CollectionItem {
  content_id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  media_type: CollectionMediaType;
  season_count?: number | null;
  created_at?: string | null;
  user_id?: string;
}

type CollectionCache = {
  userId: string;
  items: CollectionItem[];
  fetchedAt: number;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CACHE_TTL =
  5 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Cache                                                                      */
/* -------------------------------------------------------------------------- */

let collectionCache:
  | CollectionCache
  | null = null;

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

const MEDIA_TYPES: CollectionMediaType[] =
  [
    "movie",
    "tv",
    "anime",
    "k-drama",
  ];

const isCollectionMediaType = (
  value: unknown,
): value is CollectionMediaType =>
  typeof value === "string" &&
  MEDIA_TYPES.includes(
    value as CollectionMediaType,
  );

const isCollectionItem = (
  value: unknown,
): value is CollectionItem => {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const item =
    value as Partial<CollectionItem>;

  return (
    typeof item.content_id ===
      "number" &&
    Number.isFinite(
      item.content_id,
    ) &&
    typeof item.title ===
      "string" &&
    typeof item.poster_path ===
      "string" &&
    typeof item.release_date ===
      "string" &&
    typeof item.vote_average ===
      "number" &&
    Number.isFinite(
      item.vote_average,
    ) &&
    isCollectionMediaType(
      item.media_type,
    )
  );
};

const normalizeItems = (
  value: unknown,
): CollectionItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    isCollectionItem,
  );
};

/* -------------------------------------------------------------------------- */
/* Cache helpers                                                              */
/* -------------------------------------------------------------------------- */

const isCacheValid = (
  userId: string,
): boolean => {
  if (
    !collectionCache ||
    collectionCache.userId !==
      userId
  ) {
    return false;
  }

  return (
    Date.now() -
      collectionCache.fetchedAt <
    CACHE_TTL
  );
};

const setCache = (
  userId: string,
  items: CollectionItem[],
): void => {
  collectionCache = {
    userId,
    items,
    fetchedAt: Date.now(),
  };
};

/**
 * Clears the in-memory collection cache.
 *
 * Useful when:
 * - signing out
 * - switching users
 * - manually refreshing collection data
 */
export const clearCollectionCache =
  (): void => {
    collectionCache = null;
  };

/**
 * Returns the currently cached collection.
 *
 * This intentionally does not perform I/O.
 */
export const getCachedCollection =
  (): CollectionItem[] | null => {
    return (
      collectionCache?.items ??
      null
    );
  };

/* -------------------------------------------------------------------------- */
/* Fetch                                                                      */
/* -------------------------------------------------------------------------- */

export const fetchUserCollection =
  async (
    force = false,
  ): Promise<
    CollectionItem[]
  > => {
    const {
      data: {
        user,
      },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      clearCollectionCache();
      return [];
    }

    if (
      !force &&
      isCacheValid(user.id)
    ) {
      return (
        collectionCache?.items ??
        []
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "watched_content",
      )
      .select(
        [
          "content_id",
          "title",
          "poster_path",
          "release_date",
          "vote_average",
          "media_type",
          "season_count",
          "created_at",
          "user_id",
        ].join(", "),
      )
      .eq(
        "user_id",
        user.id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (error) {
      console.error(
        "[Collection] Failed to fetch collection:",
        error.message,
      );

      /*
       * Don't replace good cached data
       * with an error result.
       */
      return (
        isCacheValid(user.id)
          ? collectionCache?.items ??
            []
          : []
      );
    }

    const items =
      normalizeItems(data);

    setCache(
      user.id,
      items,
    );

    return items;
  };

/* -------------------------------------------------------------------------- */
/* Cache mutation                                                             */
/* -------------------------------------------------------------------------- */

export const setCachedCollection =
  (
    items: CollectionItem[],
  ): void => {
    /*
     * We need the current user because
     * the cache is user-scoped.
     *
     * This function remains synchronous
     * for existing callers, so only update
     * an already-associated cache.
     */
    if (!collectionCache) {
      return;
    }

    setCache(
      collectionCache.userId,
      normalizeItems(items),
    );
  };

export const removeCollectionItem =
  (
    contentId: number,
  ): void => {
    if (!collectionCache) {
      return;
    }

    const filtered =
      collectionCache.items.filter(
        (item) =>
          item.content_id !==
          contentId,
      );

    setCache(
      collectionCache.userId,
      filtered,
    );
  };

export const addCollectionItem =
  (
    item: CollectionItem,
  ): void => {
    if (!collectionCache) {
      return;
    }

    const exists =
      collectionCache.items.some(
        (existing) =>
          existing.content_id ===
          item.content_id,
      );

    if (exists) {
      return;
    }

    setCache(
      collectionCache.userId,
      [
        item,
        ...collectionCache.items,
      ],
    );
  };