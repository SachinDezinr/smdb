import React, { useState } from 'react';
import { ContentItem } from '@/lib/tmdb/types';
import { Star, Flame, Award, Calendar, Sparkles, Film, Tv, Play, Plus, Check } from 'lucide-react';
import { MovieDetailsModal } from '@/components/modals/MovieDetailsModal';
import { useWatchlistStore } from '@/lib/watchlistStore';

interface RecommendationCardProps {
  item: ContentItem;
  year: number;
  rankIndex: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  year,
  rankIndex,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();

  const isSaved = isInWatchlist(item.id);
  const isFuture = year > new Date().getFullYear();

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist({
        id: item.id,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.media_type,
        rating: item.rating,
        release_date: item.release_date,
      });
    }
  };

  const posterSrc = item.poster_path
    ? item.poster_path.startsWith('http')
      ? item.poster_path
      : `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : '/placeholder.svg';

  return (
    <>
      <div
        id={`year-card-${year}`}
        onClick={() => setModalOpen(true)}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-3 sm:p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
      >
        <div className="flex flex-row gap-3.5 sm:gap-5 items-start">
          {/* Left Column: Poster + Rating directly underneath */}
          <div className="flex-shrink-0 w-24 sm:w-28 md:w-36 flex flex-col items-center gap-1.5">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md">
              <img
                src={posterSrc}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/90 text-black flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-black translate-x-0.5" />
                </div>
              </div>

              {/* Bookmark quick button */}
              <button
                type="button"
                onClick={handleWatchlistToggle}
                className="absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                title={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
              >
                {isSaved ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary group-hover:text-black" /> : <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>
            </div>

            {/* Rating directly below the poster */}
            {item.rating > 0 ? (
              <div className="w-full inline-flex items-center justify-center gap-1 py-0.5 px-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] sm:text-xs font-bold">
                <Star className="w-3 h-3 fill-primary text-primary flex-shrink-0" />
                <span>{item.rating.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground font-normal">/10</span>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground font-medium">Unrated</div>
            )}
          </div>

          {/* Right Column: Details (Year tag, Title, Media tag, Overview, Meta) */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div>
              {/* Top row: Year & Badges */}
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-white font-['Poppins'] flex items-center gap-0.5 leading-none">
                    <span className="text-primary font-mono text-base sm:text-lg">#</span>
                    {year}
                  </span>
                  {isFuture ? (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 font-semibold">
                      <Flame className="w-2.5 h-2.5" /> Anticipated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-semibold">
                      <Award className="w-2.5 h-2.5" /> Best of {year}
                    </span>
                  )}
                </div>

                <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                  #{rankIndex}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-sm sm:text-lg md:text-xl font-bold text-white group-hover:text-primary transition-colors leading-snug line-clamp-1 sm:line-clamp-2 mb-1.5">
                {item.title}
              </h2>

              {/* Format & Votes Pills */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-white/[0.08] text-white/90">
                  {item.media_type === 'movie' ? '🎬 Movie' : '📺 Series'}
                </span>
                {item.vote_count ? (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    • {item.vote_count.toLocaleString()} votes
                  </span>
                ) : null}
              </div>

              {/* Overview (concise 2 lines on mobile, 3 lines on tablet/pc) */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                {item.overview || 'No detailed synopsis available for this title.'}
              </p>
            </div>

            {/* Bottom Meta Footer */}
            <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1 truncate text-neutral-300">
                <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Release: {item.release_date || `${year}`}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-primary font-medium flex-shrink-0">
                <Sparkles className="w-3 h-3" />
                Top Pick
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modal (Trailer, cast, recommendations, watchlist, reviews) */}
      <MovieDetailsModal
        item={item}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};
