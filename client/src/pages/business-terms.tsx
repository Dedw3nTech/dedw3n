import PageContent from "@/components/layout/PageContent";
import { SEOHead } from "@/components/seo/SEOHead";

export default function BusinessTermsPage() {
  return (
    <>
      <SEOHead 
        title="Business Terms of Service"
        description="Business Terms and Conditions for Dedw3n marketplace platform. Comprehensive legal agreement governing business vendor and buyer relationships."
      />
      <PageContent pageId="business-terms" />
    </>
  );
}