import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect, useMemo } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export default function TermsPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Terms of Service - Dedw3n";
  }, []);

  // Master Translation mega-batch for Terms page (6 texts)
  const termsTexts = useMemo(() => [
    "Terms of Service",
    "The rules and guidelines governing your use of our platform and services.",
    "Service Usage", "User Responsibilities", "Platform Guidelines", "Legal Information"
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(termsTexts, 'instant');
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading translations...</div>;
  }
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = termsTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };

  return (
    <>

      <PageContent pageId="terms" />
    </>
  );
}