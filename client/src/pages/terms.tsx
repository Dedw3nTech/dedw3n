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
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-center">
            {termsOfServiceText}
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-2xl mx-auto">
            {termsDescriptionText}
          </p>
        </Container>
      </div>
      <PageContent pageId="terms" />
    </>
  );
}