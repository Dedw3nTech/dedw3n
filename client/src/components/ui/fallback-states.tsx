import { AlertCircle, FileWarning } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import loadingLogo from "@/assets/loading-logo.png";

interface LoadingProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message = "Loading...", className = "" }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-white ${className}`}>
      <img 
        src={loadingLogo} 
        alt="Loading" 
        className="h-20 w-20 animate-bounce mb-6"
      />
      <p className="text-black text-lg font-medium">{message}</p>
    </div>
  );
}

interface ContentErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ContentError({ 
  title = "Error Loading Content", 
  message = "There was a problem loading this content. Please try again later.",
  onRetry,
  className = ""
}: ContentErrorProps) {
  return (
    <div className={`p-4 ${className}`}>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
        </AlertDescription>
      </Alert>
      {onRetry && (
        <div className="flex justify-center mt-4">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  title = "No Content Found",
  message = "There's nothing to display here yet.",
  icon = <FileWarning className="h-16 w-16 text-muted-foreground/60" />,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-3 w-[80px]" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-[90%] mb-2" />
      <Skeleton className="h-4 w-[80%] mb-4" />
      <Skeleton className="h-[140px] w-full rounded-md mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function SkeletonCardList({ count = 3, className = "" }: SkeletonCardProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}