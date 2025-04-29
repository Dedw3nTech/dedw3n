import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface QueryErrorBoundaryProps {
  error: Error;
  queryKey: unknown[];
  children?: ReactNode;
  className?: string;
}

export function QueryErrorBoundary({
  error,
  queryKey,
  children,
  className = "",
}: QueryErrorBoundaryProps) {
  const queryClient = useQueryClient();
  
  const handleRetry = () => {
    // Invalidate the query to force a refetch
    queryClient.invalidateQueries({ queryKey });
  };

  return (
    <div className={`p-4 ${className}`}>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription className="mt-2">
          {error?.message || "An unexpected error occurred while fetching data"}
        </AlertDescription>
      </Alert>
      <div className="flex justify-center mt-4">
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
      {children}
    </div>
  );
}