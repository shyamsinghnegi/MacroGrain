import { Skeleton } from "@/components/skeleton"

export default function MacrosLoading() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-5 w-4" />
        <Skeleton className="h-5 w-36" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-card bg-card p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="mt-2 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
