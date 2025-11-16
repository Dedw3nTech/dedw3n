import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect, useMemo } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function TermsPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Terms of Service - Dedw3n";
  }, []);

  // Master Translation mega-batch for Terms page - comprehensive content
  const termsTexts = useMemo(() => [
    "Terms of Service",
    "The rules and guidelines governing your use of our platform and services.",
    "Service Usage", 
    "User Responsibilities", 
    "Platform Guidelines", 
    "Legal Information",
    "I. About",
    "What we do",
    "About you and our Users",
    "Hosting, where we act as an intermediary between Buyers and Sellers",
    "Community & Dating services facilitate user interaction and engagement",
    "Escrow services, which is applied for a fee in every Transaction",
    "Other optional services for our Buyers and Sellers",
    "We are responsible for the Services we provide",
    "You are one of our Users who",
    "Is at least 18 years old",
    "Has an Account",
    "Uses our Services for personal and business purposes",
    "Has the capacity and rights to be able to carry out Transactions",
    "You are legally qualified to have a binding contract",
    "You are seeking meaningful relationships",
    "Legal Agreement",
    "Terms and Conditions",
    "User Agreement",
    "Service Terms",
    "Privacy Policy",
    "Cookie Policy",
    "Platform Rules",
    "User Guidelines",
    "Account Requirements"
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(termsTexts, 'high');
  
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
      <Container className="py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t("Terms of Service")}</h1>
          <div className="mb-8">
            <Link href="/business-terms">
              <Button variant="default" className="bg-black hover:bg-gray-800 text-white" data-testid="button-business-terms">
                {t("Visit our Business Terms of Service")}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
      <PageContent pageId="terms" />
    </>
  );
}