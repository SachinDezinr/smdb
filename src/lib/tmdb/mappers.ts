import { ContentItem, MediaType } from './types';

const ADULT_KEYWORDS = [
  'hentai', 'porn', 'erotica', 'erotic', 'sexy', 'hot scenes', 
  'ullu', 'altbalaji', 'kooku', 'hotshots', 'primeplay', 'voovi', 
  'rabbit movies', 'gully movies', 'besharams', 'hunters', 'atrangii'
];

export const mapResults = (results: any[], defaultType: MediaType): ContentItem[] => {
  return (results || [])
    .filter((item: any) => {
      if (item.adult) return false;
      
      const title = (item.title || item.name || '').trim();
      if (!title) return false;

      const overview = (item.overview || '').toLowerCase();
      const titleLower = title.toLowerCase();
      
      const isAdultContent = ADULT_KEYWORDS.some(kw => titleLower.includes(kw) || overview.includes(kw));
      if (isAdultContent) return false;

      const hasPoster = !!item.poster_path;
      const hasRating = typeof item.vote_average === 'number' && item.vote_average > 0;
      if (!hasPoster && !hasRating) return false;

      return true;
    })
    .map((item: any) => {
      let type: MediaType = defaultType;
      const isAnimated = item.genre_ids?.includes(16) || item.genres?.some((g: any) => g.id === 16 || g.name === 'Animation');
      const isJapanese = item.original_language === 'ja' || (Array.isArray(item.origin_country) && item.origin_country.includes('JP'));
      const isKorean = item.original_language === 'ko' || (Array.isArray(item.origin_country) && item.origin_country.includes('KR'));
      const isExplicitTv = item.media_type === 'tv' || !!item.first_air_date || (defaultType === 'tv' && !item.title);
      const isExplicitMovie = item.media_type === 'movie' || (defaultType === 'movie' && !item.first_air_date);

      if ((isJapanese && isAnimated) || (isJapanese && defaultType === 'anime') || defaultType === 'anime') {
        type = 'anime';
      } else if (isKorean && (isExplicitTv || defaultType === 'k-drama')) {
        type = 'k-drama';
      } else if (defaultType === 'k-drama') {
        type = 'k-drama';
      } else if (isJapanese) {
        type = 'anime';
      } else if (isExplicitTv) {
        type = 'tv';
      } else if (isExplicitMovie) {
        type = 'movie';
      } else {
        type = (item.media_type as MediaType) || defaultType;
      }

      return {
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : "",
        backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "",
        release_date: item.release_date || item.first_air_date || "TBA",
        vote_average: item.vote_average || 0,
        media_type: type,
        genre_ids: item.genre_ids || [],
        overview: item.overview || "",
        popularity: item.popularity || 0,
        adult: item.adult,
        videos: item.videos,
        season_count: item.number_of_seasons || (Array.isArray(item.seasons) ? item.seasons.filter((s: any) => s && s.season_number > 0).length : undefined)
      };
    });
};

export const interleave = <T>(...arrays: T[][]): T[] => {
  const result: T[] = [];
  const maxLen = Math.max(...arrays.map(a => a.length));
  for (let i = 0; i < maxLen; i++) {
    arrays.forEach(arr => {
      if (i < arr.length) result.push(arr[i]);
    });
  }
  return result;
};

export const uniqueById = (items: ContentItem[]): ContentItem[] => {
  const seen = new Set<number>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export const sortYearContent = (items: ContentItem[]) => {
  return items.sort((a, b) => {
    const aDate = a.release_date && a.release_date !== "TBA" ? new Date(a.release_date).getTime() : 0;
    const bDate = b.release_date && b.release_date !== "TBA" ? new Date(b.release_date).getTime() : 0;
    
    const aHasRating = a.vote_average > 0;
    const bHasRating = b.vote_average > 0;

    const RATING_BONUS = 90 * 24 * 60 * 60 * 1000;
    
    const aScore = aDate + (aHasRating ? RATING_BONUS : 0);
    const bScore = bDate + (bHasRating ? RATING_BONUS : 0);

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    return (b.popularity || 0) - (a.popularity || 0);
  });
};