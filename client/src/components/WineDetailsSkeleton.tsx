function SkeletonBox({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className || ''}`}
      {...props}
    />
  );
}

export default function WineDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 h-16">
        <SkeletonBox className="h-6 w-6 rounded-full" />
        <SkeletonBox className="h-6 w-32" />
        <SkeletonBox className="h-6 w-6 rounded-full" />
      </div>

      {/* Wine Image Skeleton */}
      <div className="flex justify-center mb-8 px-4">
        <SkeletonBox className="h-80 w-48 rounded-lg" />
      </div>

      {/* Wine Title Skeleton */}
      <div className="px-6 mb-6">
        <SkeletonBox className="h-8 w-3/4 mb-2" />
        <SkeletonBox className="h-6 w-1/2" />
      </div>

      {/* Ratings Skeleton */}
      <div className="px-6 mb-8">
        <div className="flex gap-4 justify-center">
          <div className="flex flex-col items-center">
            <SkeletonBox className="h-12 w-16 rounded-lg mb-2" />
            <SkeletonBox className="h-4 w-8" />
          </div>
          <div className="flex flex-col items-center">
            <SkeletonBox className="h-12 w-16 rounded-lg mb-2" />
            <SkeletonBox className="h-4 w-8" />
          </div>
          <div className="flex flex-col items-center">
            <SkeletonBox className="h-12 w-16 rounded-lg mb-2" />
            <SkeletonBox className="h-4 w-8" />
          </div>
          <div className="flex flex-col items-center">
            <SkeletonBox className="h-12 w-16 rounded-lg mb-2" />
            <SkeletonBox className="h-4 w-10" />
          </div>
        </div>
      </div>

      {/* Wine Description Skeleton */}
      <div className="px-6 mb-8">
        <SkeletonBox className="h-4 w-full mb-2" />
        <SkeletonBox className="h-4 w-full mb-2" />
        <SkeletonBox className="h-4 w-3/4 mb-2" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>

      {/* Buy Again Button Skeleton */}
      <div className="px-6 mb-8">
        <SkeletonBox className="h-14 w-full rounded-xl" />
      </div>

      {/* Recommendations Section Skeleton */}
      <div className="px-6 mb-8">
        <SkeletonBox className="h-8 w-48 mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((index) => (
            <div key={index} className="min-w-52 flex-shrink-0">
              <SkeletonBox className="h-48 w-full rounded-xl mb-4" />
              <SkeletonBox className="h-6 w-3/4 mb-2" />
              <div className="flex gap-3 justify-center">
                <SkeletonBox className="h-6 w-12" />
                <SkeletonBox className="h-6 w-12" />
                <SkeletonBox className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Interface Skeleton */}
      <div className="px-6">
        <SkeletonBox className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}