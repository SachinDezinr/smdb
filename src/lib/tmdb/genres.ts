export interface GenreOption {
  id: number | string;
  name: string;
}

const ALL_GENRES: GenreOption = { id: 'all', name: 'All Genres' };

/**
 * Every genre is defined exactly once. The lists below only pick keys,
 * so names and ids can't drift apart between lists, and shared genres
 * are the same object in memory.
 */
const GENRES = {
  // shared between movies and TV
  animation: { id: 16, name: 'Animation' },
  comedy: { id: 35, name: 'Comedy' },
  crime: { id: 80, name: 'Crime' },
  documentary: { id: 99, name: 'Documentary' },
  drama: { id: 18, name: 'Drama' },
  family: { id: 10751, name: 'Family' },
  mystery: { id: 9648, name: 'Mystery' },
  thriller: { id: 53, name: 'Thriller' },
  western: { id: 37, name: 'Western' },

  // movie only
  action: { id: 28, name: 'Action' },
  adventure: { id: 12, name: 'Adventure' },
  fantasy: { id: 14, name: 'Fantasy' },
  history: { id: 36, name: 'History' },
  horror: { id: 27, name: 'Horror' },
  music: { id: 10402, name: 'Music' },
  romance: { id: 10749, name: 'Romance' },
  sciFi: { id: 878, name: 'Sci-Fi' },
  war: { id: 10752, name: 'War' },

  // TV only
  actionAdventure: { id: 10759, name: 'Action & Adventure' },
  kids: { id: 10762, name: 'Kids' },
  news: { id: 10763, name: 'News' },
  reality: { id: 10764, name: 'Reality' },
  sciFiFantasy: { id: 10765, name: 'Sci-Fi & Fantasy' },
  talk: { id: 10767, name: 'Talk' },
  soap: { id: 10766, name: 'Soap' },
  warPolitics: { id: 10768, name: 'War & Politics' },
} as const satisfies Record<string, GenreOption>;

type GenreKey = keyof typeof GENRES;

const buildList = (...keys: GenreKey[]): GenreOption[] => [
  ALL_GENRES,
  ...keys.map((key) => GENRES[key]),
];

export const MOVIE_GENRES: GenreOption[] = buildList(
  'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama',
  'family', 'fantasy', 'history', 'horror', 'music', 'mystery', 'romance',
  'sciFi', 'thriller', 'war', 'western'
);

export const TV_GENRES: GenreOption[] = buildList(
  'actionAdventure', 'animation', 'comedy', 'crime', 'documentary', 'drama',
  'family', 'kids', 'mystery', 'news', 'reality', 'sciFiFantasy', 'talk',
  'thriller', 'tvShows', 'warPolitics', 'western'
);

// Unified genre list for "All" or combined category (K-Drama / Anime)
export const COMMON_GENRES: GenreOption[] = buildList(
  'action', 'adventure', 'animation', 'comedy', 'crime', 'drama', 'fantasy',
  'horror', 'mystery', 'romance', 'sciFi', 'thriller'
);