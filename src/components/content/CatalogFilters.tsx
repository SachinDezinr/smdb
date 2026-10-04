import { ChevronDown, Filter, LayoutGrid } from "lucide-react";
import type { MediaType, Region } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CATEGORIES: readonly {
  label: string;
  value: MediaType;
}[] = [
  { label: "Movies", value: "movie" },
  { label: "Web Series", value: "tv" },
  { label: "Anime", value: "anime" },
  { label: "K-Drama", value: "k-drama" },
];

export const REGIONS: readonly {
  label: string;
  value: Region;
}[] = [
  { label: "All Regions", value: "all" },
  { label: "Hollywood", value: "hollywood" },
  { label: "Bollywood", value: "bollywood" },
  { label: "Pollywood", value: "punjabi" },
  { label: "Tollywood", value: "south-indian" },
  { label: "Animated", value: "animated" },
];

interface CatalogFiltersProps {
  activeCategory: MediaType;
  activeRegion: Region;
  onCategoryChange: (category: MediaType) => void;
  onRegionChange: (region: Region) => void;
}

export const CatalogFilters = ({
  activeCategory,
  activeRegion,
  onCategoryChange,
  onRegionChange,
}: CatalogFiltersProps) => {
  const showRegionFilters =
    activeCategory !== "anime" && activeCategory !== "k-drama";

  const activeCategoryLabel =
    CATEGORIES.find((category) => category.value === activeCategory)?.label ??
    "Movies";

  const activeRegionLabel =
    REGIONS.find((region) => region.value === activeRegion)?.label ??
    "All Regions";

  return (
    <div className="space-y-2.5">
      <div className="hidden lg:flex flex-col gap-2 items-center justify-center">
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.value;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => onCategoryChange(category.value)}
                aria-pressed={isActive}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border",
                  isActive
                    ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.07] hover:text-white",
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {showRegionFilters && (
          <div className="flex flex-wrap gap-1.5 justify-center items-center">
            {REGIONS.map((region) => {
              const isActive = activeRegion === region.value;

              return (
                <button
                  key={region.value}
                  type="button"
                  onClick={() => onRegionChange(region.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-semibold text-[11px] tracking-wide transition-all border",
                    isActive
                      ? "bg-white/15 border-primary/60 text-primary shadow-sm"
                      : "bg-white/[0.02] border-white/5 text-muted-foreground hover:text-white",
                  )}
                >
                  {region.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:hidden flex flex-wrap gap-2 justify-center items-center pt-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-black rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
              aria-label={`Select category, currently ${activeCategoryLabel}`}
            >
              <LayoutGrid size={14} />
              {activeCategoryLabel}
              <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="bg-neutral-950 border-white/10 text-white">
            {CATEGORIES.map((category) => (
              <DropdownMenuItem
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className="text-xs font-semibold py-2"
              >
                {category.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {showRegionFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-xl font-semibold text-xs tracking-wide"
                aria-label={`Select region, currently ${activeRegionLabel}`}
              >
                <Filter size={13} className="text-primary" />
                {activeRegionLabel}
                <ChevronDown size={12} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="bg-neutral-950 border-white/10 text-white">
              {REGIONS.map((region) => (
                <DropdownMenuItem
                  key={region.value}
                  onClick={() => onRegionChange(region.value)}
                  className="text-xs font-semibold py-2"
                >
                  {region.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};