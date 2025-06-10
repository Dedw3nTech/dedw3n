import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";
import { format } from "date-fns";

interface PageContentProps {
  pageId: string;
  showLastUpdated?: boolean;
}

interface PageData {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
}

export default function PageContent({ pageId, showLastUpdated = true }: PageContentProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: page, isLoading, error } = useQuery<PageData>({
    queryKey: [`/api/page/${pageId}`],
    enabled: isClient,
  });

  if (isLoading) {
    return (
      <Container className="py-16">
        <Skeleton className="h-12 w-3/4 mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Error Loading Content</h1>
          <p className="text-gray-700 mb-6">
            We're having trouble loading the content you requested. Please try again later.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{page?.title}</h1>
        <div 
          className="prose prose-lg max-w-none text-gray-700 mb-8"
          dangerouslySetInnerHTML={{ __html: page?.content || "" }}
        />
        {showLastUpdated && page?.lastUpdated && (
          <p className="text-sm text-gray-500 mt-12">
            Last updated: {format(new Date(page.lastUpdated), "MMMM dd, yyyy")}
          </p>
        )}
      </div>
    </Container>
  );
}