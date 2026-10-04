import type { ContentItem, MediaType, Region } from "./tmdb";

export interface CatalogState {
  activeCategory: MediaType;
  activeRegion: Region;
  searchQuery: string;
  expandedYears: number[];
  yearData: Record<number, ContentItem[]>;
  yearPages: Record<number, number>;
  watchedIds: number[];
}

const currentYear = new Date().getFullYear();

const initialCatalogState: CatalogState = {
  activeCategory: "movie",
  activeRegion: "all",
  searchQuery: "",
  expandedYears: [currentYear],
  yearData: {},
  yearPages: {},
  watchedIds: [],
};

let catalogState: CatalogState = initialCatalogState;

export const getCatalogState = (): CatalogState => catalogState;

export const setCatalogState = (
  updates: Partial<CatalogState>,
): CatalogState => {
  catalogState = {
    ...catalogState,
    ...updates,
  };

  return catalogState;
};

export const resetCatalogState = (): CatalogState => {
  catalogState = {
    ...initialCatalogState,
    expandedYears: [currentYear],
    yearData: {},
    yearPages: {},
    watchedIds: [],
  };

  return catalogState;
};