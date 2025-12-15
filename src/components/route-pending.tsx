import { Skeleton } from './ui/skeleton'

export default function RoutePending() {
  return (
    <div className="px-4 md:px-8 pt-2 space-y-4 animate-in fade-in duration-300">
      {/* Hero section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-4 w-48 mx-auto mt-2" />
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Map skeleton */}
      <div className="bg-card border border-border rounded-xl p-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  )
}
