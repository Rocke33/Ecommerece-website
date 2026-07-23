

export default function OrderSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Bar Skeleton */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap justify-between items-center gap-2">
            <div className="flex gap-4 w-2/3">
              <div className="h-3 bg-gray-200 rounded-sm w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded-sm w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded-sm w-1/4"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
          </div>

          {/* Item Row Skeleton */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-3/4">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0"></div>
              <div className="space-y-2 w-1/2">
                <div className="h-4 bg-gray-200 rounded-sm w-full"></div>
                <div className="h-3 bg-gray-200 rounded-sm w-1/4"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded-sm w-12"></div>
          </div>

          {/* Footer Bar Skeleton */}
          <div className="bg-gray-50/50 border-t border-gray-150 px-4 py-2.5">
            <div className="h-3 bg-gray-200 rounded-sm w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}