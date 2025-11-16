import PageContent from "@/components/layout/PageContent";
import { SEOHead } from "@/components/seo/SEOHead";
import { useEffect, useMemo } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export default function BusinessTermsPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Business Terms of Service - Dedw3n";
  }, []);

  // Master Translation batch for Business Terms page
  const businessTermsTexts = useMemo(() => [
    "Business Terms of Service",
    "Business Terms and Conditions for Dedw3n marketplace platform. Comprehensive legal agreement governing business vendor and buyer relationships.",
    "About",
    "What we do",
    "Hosting, where we act as an intermediary between Buyers and Sellers",
    "Community & Dating services facilitate user interaction and engagement",
    "Escrow services, which is applied for a fee in every Transaction",
    "Other optional services for our Buyers and Sellers",
    "Business Vendor Requirements",
    "Payment Processing",
    "Legal Compliance",
    "Terms and Conditions",
    "Service Agreement",
    "Vendor Responsibilities",
    "Platform Guidelines",
    "Business Partnership"
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(businessTermsTexts, 'high');
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading translations...</div>;
  }
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = businessTermsTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };

  return (
    <>
      <SEOHead 
        title={t("Business Terms of Service")}
        description={t("Business Terms and Conditions for Dedw3n marketplace platform. Comprehensive legal agreement governing business vendor and buyer relationships.")}
      />
      <PageContent pageId="business-terms" />
    </>
  );
}