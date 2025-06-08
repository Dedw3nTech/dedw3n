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
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-center">
            {t("Privacy Policy")}
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-2xl mx-auto">
            {t("How we collect, use, and protect your personal information.")}
          </p>
        </Container>
      </div>
      <PageContent pageId="privacy" />
    </>
  );
}