import { useQuery } from '@tanstack/react-query';
import PageContent from '@/components/layout/PageContent';
import { useEffect } from 'react';

export default function AffiliatePartnerships() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Affiliate Partnerships - Dedw3n";
  }, []);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['/api/page/affiliate-partnerships'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading affiliate partnerships information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {pageData && <PageContent content={pageData.content} />}
      </div>
    </div>
  );
}