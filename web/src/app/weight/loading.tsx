import { Skeleton } from "@/components/skeleton"

export default function WeightLoading() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <Skeleton className="h-7 w-24" />

      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>

      <Skeleton className="h-[150px] w-full rounded-hero" />

      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-7 flex-1 rounded-pill" />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
