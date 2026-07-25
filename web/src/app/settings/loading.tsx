import { Skeleton } from "@/components/skeleton"

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <Skeleton className="h-7 w-24" />

      <div className="flex items-center gap-3 rounded-card bg-card p-4 shadow-card">
        <Skeleton className="size-12.5 rounded-input" />
        <div className="flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1.5 h-3 w-36" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-card">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-card">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
