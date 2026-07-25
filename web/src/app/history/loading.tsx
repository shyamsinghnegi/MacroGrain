import { Skeleton } from "@/components/skeleton"

export default function HistoryLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-4" />
      </div>

      <div className="rounded-hero bg-surface p-6 shadow-hero">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="mt-3 h-9 w-28" />
      </div>

      <div className="flex flex-col gap-5">
        {Array.from({ length: 2 }, (_, g) => (
          <div key={g} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
