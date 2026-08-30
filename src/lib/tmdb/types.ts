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

export interface ContentItem {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  vote_average: number;
  media_type: MediaType;
  genre_ids: number[];
  overview: string;
  popularity?: number;
  adult?: boolean;
  videos?: { results: any[] };
}