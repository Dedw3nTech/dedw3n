import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect, useMemo } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export default function PrivacyPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Privacy Policy - Dedw3n";
  }, []);

  // Master Translation mega-batch for Privacy page (6 texts)
  const privacyTexts = useMemo(() => [
    "Privacy Policy",
    "How we collect, use, and protect your personal information.",
    "Data Collection", "Information Security", "User Rights", "Contact Us"
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(privacyTexts, 'instant');
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading translations...</div>;
  }
  
  const t = (text: string): string => {
    if (Array.isArray(translations)) {
      const index = privacyTexts.indexOf(text);
      return index !== -1 ? translations[index] || text : text;
    }
    return text;
  };

  return (
    <>

      <PageContent pageId="privacy" />
    </>
  );
}