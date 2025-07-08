import PageContent from '@/components/layout/PageContent';
import { useEffect } from 'react';

export default function AffiliatePartnerships() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Affiliate Partnerships - Dedw3n";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PageContent pageId="affiliate-partnerships" />
    </div>
  );
}