// Shared loading-skeleton primitive - a pulsing block matching the app's
// card language (rounded corners, card-alt fill). Composed into full-page
// skeletons (one per route, in each route's own loading.tsx) that mirror
// that specific page's real layout, rather than one generic spinner - so
// the transition from skeleton to real content doesn't visibly reflow.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-card-alt ${className}`} />
}
