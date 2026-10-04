import type { MediaType, Region } from "./types";

type RegionParams = Record<string, string>;

const START_YEARS: Record<MediaType, Partial<Record<Region, number>>> = {
  movie: {
    punjabi: 1970,
    "south-indian": 1950,
    animated: 1960,
    bollywood: 1950,
    hollywood: 1950,
  },
  tv: {
    hollywood: 1950,
    all: 1950,
    bollywood: 1985,
    punjabi: 2000,
    "south-indian": 1995,
    animated: 1965,
  },
  anime: {},
  "k-drama": {},
};

const DEFAULT_START_YEAR: Record<MediaType, number> = {
  movie: 1950,
  tv: 1950,
  anime: 1961,
  "k-drama": 1970,
};

export const getStartYear = (
  category: MediaType,
  region: Region,
): number =>
  START_YEARS[category][region] ??
  DEFAULT_START_YEAR[category];

const REGION_PARAMS: Partial<Record<Region, RegionParams>> = {
  bollywood: {
    with_original_language: "hi",
    region: "IN",
  },
  punjabi: {
    with_original_language: "pa",
    region: "IN",
  },
  "south-indian": {
    with_original_language: "te|ta|kn|ml",
    region: "IN",
  },
  hollywood: {
    with_original_language: "en",
    region: "US",
  },
  animated: {
    with_genres: "16",
  },
  korean: {
    with_original_language: "ko",
  },
  indian: {
    with_original_language: "hi|te|ta|kn|ml|pa",
    region: "IN",
  },
  international: {
    with_original_language:
      "fr|de|es|it|ja|ko|zh|hi|te|ta|kn|ml|pa",
  },
};

export const getRegionParams = (
  region: Region,
): RegionParams =>
  REGION_PARAMS[region] ?? {};