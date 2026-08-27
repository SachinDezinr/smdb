import { MediaType, Region, ContentItem } from './tmdb';

export interface CatalogState {
  activeCategory: MediaType;
  activeRegion: Region;
  searchQuery: string;
  expandedYears: number[];
  yearData: Record<number, ContentItem[]>;
  yearPages: Record<number, number>;
  watchedIds: number[];
  scrollY: number;
}

const currentYear = new Date().getFullYear();

let catalogState: CatalogState = {
  activeCategory: 'movie',
  activeRegion: 'all',
  searchQuery: '',
  expandedYears: [currentYear],
  yearData: {},
  yearPages: {},
  watchedIds: [],
  scrollY: 0,
};

export const getCatalogState = (): CatalogState => catalogState;

export const setCatalogState = (newState: Partial<CatalogState>) => {
  catalogState = { ...catalogState, ...newState };
};