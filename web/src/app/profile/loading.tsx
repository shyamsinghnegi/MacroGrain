import { Skeleton } from "@/components/skeleton"

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 sm:px-6 pt-16 pb-28 sm:max-w-xl">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-16 rounded-pill" />
      </div>

      <Skeleton className="h-[130px] w-full rounded-hero" />

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-card bg-card p-4 shadow-card">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="mt-2 h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
