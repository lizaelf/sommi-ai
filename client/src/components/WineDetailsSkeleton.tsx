function SkeletonBox({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-600/30 ${className || ''}`}
      {...props}
    />
  );
}

export default function WineDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header spacer only */}
      <div className="h-16"></div>

      {/* Wine Image Skeleton - No background, just shape */}
      <div className="flex justify-center mb-8 px-6">
        <SkeletonBox className="h-64 w-36" />
      </div>

      {/* Wine Title Skeleton - Clean lines */}
      <div className="px-6 mb-6 text-center">
        <SkeletonBox className="h-6 w-64 mx-auto mb-3" />
        <SkeletonBox className="h-4 w-20 mx-auto" />
      </div>

      {/* Ratings Skeleton - Just 4 small boxes */}
      <div className="px-6 mb-8">
        <div className="flex justify-between max-w-xs mx-auto">
          <SkeletonBox className="h-8 w-8" />
          <SkeletonBox className="h-8 w-8" />
          <SkeletonBox className="h-8 w-8" />
          <SkeletonBox className="h-8 w-8" />
        </div>
      </div>

      {/* Description lines */}
      <div className="px-6 mb-8">
        <SkeletonBox className="h-3 w-full mb-2" />
        <SkeletonBox className="h-3 w-full mb-2" />
        <SkeletonBox className="h-3 w-2/3 mb-2" />
        <SkeletonBox className="h-3 w-4/5" />
      </div>

      {/* Button skeleton */}
      <div className="px-6 mb-8">
        <SkeletonBox className="h-12 w-full" />
      </div>

      {/* Recommendation cards */}
      <div className="px-6 mb-8">
        <SkeletonBox className="h-6 w-32 mb-4" />
        <div className="flex gap-4">
          <div className="min-w-48 flex-shrink-0">
            <SkeletonBox className="h-40 w-full mb-3" />
            <SkeletonBox className="h-4 w-2/3 mb-1" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
          <div className="min-w-48 flex-shrink-0">
            <SkeletonBox className="h-40 w-full mb-3" />
            <SkeletonBox className="h-4 w-2/3 mb-1" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}