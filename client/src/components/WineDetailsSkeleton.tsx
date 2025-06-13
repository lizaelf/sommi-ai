import { Skeleton } from "@/components/ui/Skeleton";

export default function WineDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 h-16">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      {/* Wine Image Skeleton */}
      <div className="flex justify-center mb-8 px-4">
        <Skeleton className="h-80 w-48 rounded-lg" />
      </div>

      {/* Wine Title Skeleton */}
      <div className="px-6 mb-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      {/* Ratings Skeleton */}
      <div className="px-6 mb-8">
        <div className="flex gap-4 justify-center">
          <div className="flex flex-col items-center">
            <Skeleton className="h-12 w-16 rounded-lg mb-2" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-12 w-16 rounded-lg mb-2" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-12 w-16 rounded-lg mb-2" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-12 w-16 rounded-lg mb-2" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      </div>

      {/* Wine Description Skeleton */}
      <div className="px-6 mb-8">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Buy Again Button Skeleton */}
      <div className="px-6 mb-8">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* Recommendations Section Skeleton */}
      <div className="px-6 mb-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((index) => (
            <div key={index} className="min-w-52 flex-shrink-0">
              <Skeleton className="h-48 w-full rounded-xl mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <div className="flex gap-3 justify-center">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Interface Skeleton */}
      <div className="px-6">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}