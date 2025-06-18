function SkeletonBox({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className || ''}`}
      {...props}
    />
  );
}

export default function HomeGlobalSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 h-16">
        <SkeletonBox className="h-6 w-6 rounded-full" />
        <SkeletonBox className="h-6 w-32" />
        <SkeletonBox className="h-6 w-6 rounded-full" />
      </div>

      {/* Content */}
      <div className="px-4">
        {/* Logo Skeleton */}
        <div className="text-center mb-8">
          <SkeletonBox className="h-14 w-32 mx-auto" />
        </div>

        {/* Welcome Text Skeleton */}
        <div className="mb-10">
          <SkeletonBox className="h-4 w-full mb-2" />
          <SkeletonBox className="h-4 w-full mb-2" />
          <SkeletonBox className="h-4 w-3/4" />
        </div>

        {/* Your wines section */}
        <div className="mb-6">
          <SkeletonBox className="h-8 w-32 mb-6" />

          {/* Wine Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2].map((index) => (
              <div
                key={index}
                className="rounded-xl p-4"
                style={{
                  border: "1px solid #494949",
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Wine Bottle Image Skeleton */}
                  <div className="flex items-center justify-center">
                    <SkeletonBox className="h-42 w-16" />
                  </div>

                  {/* Wine Info Skeleton */}
                  <div className="flex-1">
                    <SkeletonBox className="h-7 w-3/4 mb-2" />
                    <SkeletonBox className="h-4 w-24 mb-3" />

                    {/* Ratings Skeleton */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((ratingIndex) => (
                        <div
                          key={ratingIndex}
                          className="flex flex-col items-center p-2 rounded-lg"
                          style={{
                            background: "rgba(255, 255, 255, 0.10)",
                          }}
                        >
                          <SkeletonBox className="h-4 w-8 mb-1" />
                          <SkeletonBox className="h-3 w-6" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="mb-6">
          <SkeletonBox className="h-8 w-40 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBox className="h-32 w-full rounded-xl" />
            <SkeletonBox className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}