import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="product-card-skeleton">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PostCardSkeleton() {
  return (
    <Card className="mb-4" data-testid="post-card-skeleton">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-48 w-full rounded-md" />
        <div className="flex justify-around pt-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function UserCardSkeleton() {
  return (
    <Card className="p-4" data-testid="user-card-skeleton">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </Card>
  );
}

export function ListSkeleton({ count = 3, ItemSkeleton = ProductCardSkeleton }: { 
  count?: number; 
  ItemSkeleton?: React.ComponentType 
}) {
  return (
    <div className="space-y-4" data-testid="list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <ItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function GridSkeleton({ 
  count = 6, 
  columns = 3, 
  ItemSkeleton = ProductCardSkeleton 
}: { 
  count?: number; 
  columns?: number;
  ItemSkeleton?: React.ComponentType 
}) {
  return (
    <div 
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}
      data-testid="grid-skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ItemSkeleton key={i} />
      ))}
    </div>
  );
}
