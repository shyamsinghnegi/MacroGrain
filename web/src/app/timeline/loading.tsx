import { Skeleton } from "@/components/skeleton"

// Mirrors timeline/page.tsx's real layout (day-nav header + pill + 24
// hour rows) so the skeleton's row count/height matches what replaces it.
export default function TimelineLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full flex-col gap-4 pt-16 pb-36 sm:max-w-xl">
      <div className="flex items-center justify-between px-4 sm:px-6">
        <Skeleton className="h-5 w-4" />
        <div className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-4" />
      </div>

      <Skeleton className="mx-auto h-9 w-32 rounded-pill" />

      <div className="flex w-full flex-col">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex min-h-24 w-full gap-3 border-t border-hairline px-4 py-3 first:border-t-0"
          >
            <div className="flex w-16 shrink-0 flex-col items-start gap-1.5 pt-1">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="size-5 rounded-full" />
            </div>
            <div className="flex flex-1 items-start pt-1">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
