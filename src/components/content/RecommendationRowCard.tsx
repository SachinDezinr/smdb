import React, { useState } from 'react';
import { ContentItem } from '@/lib/tmdb/types';
import { Star, Play, Check, Heart, Film, Tv, Calendar, Info } from 'lucide-react';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useReviews } from '@/contexts/ReviewsContext';
import { ContentDetailsModal } from '@/components/content/ContentDetailsModal';
import { TrailerModal } from '@/components/content/TrailerModal';
import { ReviewModal } from '@/components/content/ReviewModal';

interface RecommendationRowCardProps {
  item: ContentItem;
  year: number;
}

export const RecommendationRowCard: React.FC<RecommendationRowCardProps> = ({ item, year }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isFavorite, toggleFavorite } = useWatchlist();
  const { getUserReview } = useReviews();

  const inWatchlist = isInWatchlist(item.id);
  const favorite = isFavorite(item.id);
  const userReview = getUserReview(item.id);

  const isMovie = item.media_type === 'movie';
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&auto=format&fit=crop&q=60';

  const ratingDisplay = item.rating > 0 ? item.rating.toFixed(1) : (item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A');

  return (
    <>
      <div className="group relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 p-3.5 sm:p-5 shadow-lg backdrop-blur-md overflow-hidden">
        {/* Horizontal flex container: Left side poster + rating, right side details */}
        <div className="flex flex-row items-start gap-3.5 sm:gap-6">
          {/* Left Column: Poster with clean rating underneath */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div
              onClick={() => setShowDetails(true)}
              className="relative w-24 sm:w-32 md:w-36 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 shadow-md cursor-pointer border border-white/10 group-hover:border-primary/40 transition-all"
            >
              <img
                src={posterUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

              {/* Quick Play Trailer hover button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTrailer(true);
                }}
                className="absolute inset-0 m-auto w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 shadow-xl"
                title="Play Trailer"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              </button>
            </div>

            {/* Rating pill right under the poster */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-white shadow-sm">
              <Star className="w-3 h-3 fill-primary text-primary" />
              <span className="text-xs font-bold text-primary font-mono">{ratingDisplay}</span>
              <span className="text-[10px] text-neutral-400">/10</span>
            </div>
          </div>

          {/* Right Column: Title, Format Tag, Release Date, Synopsis & Quick Actions */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div>
              {/* Top tag bar */}
              <div className="flex items-center gap-2 flex-wrap mb-1.5 sm:mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.08] text-neutral-200">
                  {isMovie ? <Film className="w-3 h-3 text-primary" /> : <Tv className="w-3 h-3 text-primary" />}
                  {isMovie ? 'Movie' : 'Series'}
                </span>

                {item.release_date && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-400">
                    <Calendar className="w-3 h-3" />
                    {item.release_date}
                  </span>
                )}

                {item.vote_count ? (
                  <span className="hidden sm:inline-block text-[11px] text-neutral-400">
                    • {item.vote_count.toLocaleString()} votes
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <h3
                onClick={() => setShowDetails(true)}
                className="text-base sm:text-xl md:text-2xl font-black text-white leading-snug tracking-tight hover:text-primary transition-colors cursor-pointer line-clamp-1 sm:line-clamp-2"
              >
                {item.title}
              </h3>

              {/* Synopsis: cleanly clamped to keep card sleek on phones and tablets */}
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-neutral-300/80 leading-relaxed line-clamp-2 sm:line-clamp-3 md:line-clamp-4">
                {item.overview || 'A defining title and top-rated masterpiece of this release year.'}
              </p>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Watchlist Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (inWatchlist) removeFromWatchlist(item.id);
                    else addToWatchlist(item);
                  }}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-medium transition-all ${
                    inWatchlist
                      ? 'bg-primary text-black font-bold'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 border border-white/10'
                  }`}
                  title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  <Check className={`w-3.5 h-3.5 ${inWatchlist ? 'stroke-[2.5]' : ''}`} />
                  <span className="hidden xs:inline">{inWatchlist ? 'Watched' : 'Watchlist'}</span>
                </button>

                {/* Favorite Toggle */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(item)}
                  className={`p-1 sm:p-1.5 rounded-lg border transition-all ${
                    favorite
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white border-white/10'
                  }`}
                  title={favorite ? 'Favorited' : 'Favorite'}
                >
                  <Heart className={`w-3.5 h-3.5 ${favorite ? 'fill-current' : ''}`} />
                </button>

                {/* Review button */}
                <button
                  type="button"
                  onClick={() => setShowReview(true)}
                  className={`hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all ${
                    userReview
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white border-white/10'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>{userReview ? `${userReview.rating}/10` : 'Review'}</span>
                </button>
              </div>

              {/* View details */}
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-semibold px-2 py-1 transition-colors"
              >
                <span>Details</span>
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals for complete interaction */}
      {showDetails && (
        <ContentDetailsModal
          item={item}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}

      {showTrailer && (
        <TrailerModal
          item={item}
          isOpen={showTrailer}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {showReview && (
        <ReviewModal
          item={item}
          isOpen={showReview}
          onClose={() => setShowReview(false)}
        />
      )}
    </>
  );
};
