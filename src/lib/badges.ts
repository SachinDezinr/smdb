import { 
  Compass, 
  Tv, 
  Film, 
  Sparkles, 
  Award, 
  Flame, 
  Crown,
  type LucideIcon 
} from 'lucide-react';

export interface BadgeTier {
  min: number;
  max: number | null;
  label: string;
  level: string;
  description: string;
  icon: LucideIcon;
  badgeStyle: string;
  iconColor: string;
  glowColor: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  {
    min: 0,
    max: 9,
    label: "Novice Viewer",
    level: "Tier 1",
    description: "Taking the first steps into the cinematic universe.",
    icon: Compass,
    badgeStyle: "bg-white/10 text-white/90 border-white/20",
    iconColor: "text-white/80",
    glowColor: "rgba(255, 255, 255, 0.15)"
  },
  {
    min: 10,
    max: 24,
    label: "Film Explorer",
    level: "Tier 2",
    description: "Discovering diverse genres and directors.",
    icon: Tv,
    badgeStyle: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    iconColor: "text-teal-400",
    glowColor: "rgba(20, 184, 166, 0.2)"
  },
  {
    min: 25,
    max: 49,
    label: "Dedicated Cinephile",
    level: "Tier 3",
    description: "Building an impressive watch record.",
    icon: Film,
    badgeStyle: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    iconColor: "text-blue-400",
    glowColor: "rgba(59, 130, 246, 0.2)"
  },
  {
    min: 50,
    max: 99,
    label: "Elite Cinephile",
    level: "Tier 4",
    description: "A seasoned connoisseur of cinema & series.",
    icon: Sparkles,
    badgeStyle: "bg-purple-500/15 text-purple-300 border-purple-500/35",
    iconColor: "text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.25)"
  },
  {
    min: 100,
    max: 249,
    label: "Master Cinephile",
    level: "Tier 5",
    description: "Triple-digit milestones with deep movie wisdom.",
    icon: Award,
    badgeStyle: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    iconColor: "text-amber-400",
    glowColor: "rgba(251, 191, 36, 0.25)"
  },
  {
    min: 250,
    max: 499,
    label: "Grandmaster Cinephile",
    level: "Tier 6",
    description: "Legendary taste spanning countless eras & stories.",
    icon: Flame,
    badgeStyle: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    iconColor: "text-orange-400",
    glowColor: "rgba(249, 115, 22, 0.3)"
  },
  {
    min: 500,
    max: null,
    label: "Cinema Legend",
    level: "Tier 7",
    description: "The ultimate movie authority and vault master.",
    icon: Crown,
    badgeStyle: "bg-gradient-to-r from-amber-500/25 via-yellow-400/25 to-primary/30 text-yellow-300 border-yellow-400/60 shadow-lg shadow-yellow-500/10",
    iconColor: "text-yellow-400",
    glowColor: "rgba(234, 179, 8, 0.4)"
  }
];

export const getUserBadge = (watchedCount: number): {
  current: BadgeTier;
  next: BadgeTier | null;
  progress: number;
  neededForNext: number;
} => {
  const current = BADGE_TIERS.find(tier => {
    if (tier.max === null) return watchedCount >= tier.min;
    return watchedCount >= tier.min && watchedCount <= tier.max;
  }) || BADGE_TIERS[0];

  const currentIndex = BADGE_TIERS.indexOf(current);
  const next = currentIndex < BADGE_TIERS.length - 1 ? BADGE_TIERS[currentIndex + 1] : null;

  let progress = 100;
  let neededForNext = 0;

  if (next) {
    const range = next.min - current.min;
    const currentProgress = watchedCount - current.min;
    progress = Math.min(Math.round((currentProgress / range) * 100), 100);
    neededForNext = next.min - watchedCount;
  }

  return {
    current,
    next,
    progress,
    neededForNext
  };
};