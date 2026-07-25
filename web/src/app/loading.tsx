import { Skeleton } from "@/components/skeleton"

// Mirrors page.tsx's real layout (header, hero card, chart card, 3 macro
// bars + water widget, action row) so nothing visibly reflows once the
// real data (4 parallel D1 queries - see page.tsx) resolves and replaces this.
export default function DashboardLoading() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full flex-col gap-8 overflow-hidden pt-16 pb-36 sm:max-w-xl">
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="size-9 rounded-input" />
      </div>

      <div className="relative z-10 mx-4 rounded-hero bg-surface p-6 shadow-hero sm:mx-6">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="mt-3 h-11 w-40" />
        <Skeleton className="mt-2 h-4 w-32" />
        <Skeleton className="mt-4 h-2.5 w-full" />
      </div>

      <div className="relative z-10 mx-4 rounded-hero bg-surface p-5 shadow-hero sm:mx-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-20 rounded-pill" />
        </div>
        <Skeleton className="mt-4 h-[140px] w-full" />
      </div>

      <div className="relative z-10 mx-4 flex flex-col gap-4 sm:mx-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-card bg-card p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="mt-2 h-2 w-full" />
          </div>
        ))}
        <div className="rounded-card bg-card p-4 shadow-card">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="mt-2 h-2 w-full" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-pill" />
            <Skeleton className="h-8 flex-1 rounded-pill" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-4 flex gap-2.5 sm:mx-6">
        <Skeleton className="h-10 flex-1 rounded-pill" />
        <Skeleton className="h-10 flex-1 rounded-pill" />
        <Skeleton className="h-10 flex-1 rounded-pill" />
      </div>
    </div>
  )
}
