import { Skeleton } from "@/components/skeleton"

export default function WeeklySummaryLoading() {
  return (
    <div className="mx-auto flex w-full flex-col px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="mb-5 flex items-center gap-3.5">
        <Skeleton className="h-5 w-4" />
        <Skeleton className="h-5 w-40" />
      </div>

      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-2 mb-5 h-7 w-40" />

      <Skeleton className="h-28 w-full rounded-hero" />
      <Skeleton className="my-4 h-10 w-full rounded-card" />

      <Skeleton className="mb-2.5 h-3 w-24" />
      <Skeleton className="mb-1.5 h-4 w-full" />
      <Skeleton className="mb-4.5 h-4 w-2/3" />

      <div className="flex gap-2.5">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 flex-1 rounded-input" />
        ))}
      </div>
    </div>
  )
}
