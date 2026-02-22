import { Card, CardContent } from "@/components/ui/card";

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="animate-pulse space-y-2">
                <div className="h-3 w-24 rounded bg-brown-100" />
                <div className="h-8 w-16 rounded bg-brown-100" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table skeleton */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-48 rounded bg-brown-100" />
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-32 rounded bg-brown-50" />
                <div className="h-4 w-24 rounded bg-brown-50" />
                <div className="h-4 w-20 rounded bg-brown-50" />
                <div className="h-4 flex-1 rounded bg-brown-50" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-dark" />
    </div>
  );
}
