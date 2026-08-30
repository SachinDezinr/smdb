import { MediaType, Region } from './types';

/**
 * Returns the earliest relevant start year for each category and regional filter
 * to avoid rendering years with zero available content on TMDB.
 */
export const getStartYear = (category: MediaType, region: Region): number => {
  if (category === "anime") {
    return 1961;
  }

  if (category === "k-drama") {
    return 1970;
  }

  if (category === "tv") {
    switch (region) {
      case "bollywood": return 1985;
      case "punjabi": return 2000;
      case "south-indian": return 1995;
      case "animated": return 1965;
      default: return 1960;
    }
  }

  // category === "movie"
  switch (region) {
    case "punjabi": return 1970;
    case "south-indian": return 1950;
    case "animated": return 1960;
    case "bollywood": return 1950;
    case "hollywood": return 1950;
    default: return 1950;
  }
};

export const getRegionParams = (region: Region): Record<string, string> => {
  switch (region) {
    case "bollywood": return { with_original_language: "hi", region: "IN" };
    case "punjabi": return { with_original_language: "pa", region: "IN" };
    case "south-indian": return { with_original_language: "te|ta|kn|ml", region: "IN" };
    case "hollywood": return { with_original_language: "en", region: "US" };
    case "animated": return { with_genres: "16" };
    case "korean": return { with_original_language: "ko" };
    case "indian": return { with_original_language: "hi|te|ta|kn|ml|pa", region: "IN" };
    case "international": return { with_original_language: "fr|de|es|it|ja|ko|zh|hi|te|ta|kn|ml|pa" };
    default: return {};
  }
};