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

  const [t] = useMasterBatchTranslation(termsTexts);
  const [
    termsOfServiceText, termsDescriptionText,
    serviceUsageText, userResponsibilitiesText, platformGuidelinesText, legalInformationText
  ] = t || termsTexts;

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