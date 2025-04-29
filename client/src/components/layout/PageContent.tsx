import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PageContentProps {
  pageId: string;
}

export default function PageContent({ pageId }: PageContentProps) {
  const { data: page, isLoading, error } = useQuery({
    queryKey: [`/api/page/${pageId}`],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Content Unavailable</h2>
            <p className="text-gray-600">
              We're sorry, the page content you requested is currently unavailable.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="prose max-w-none">
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
      <div className="text-sm text-gray-500 mt-8">
        Last updated: {new Date(page.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  );
}