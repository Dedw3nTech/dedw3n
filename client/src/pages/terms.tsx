import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function TermsPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Terms of Service - Dedw3n";
  }, []);

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-center">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-2xl mx-auto">
            The rules and guidelines governing your use of our platform and services.
          </p>
        </Container>
      </div>
      <PageContent pageId="terms" />
    </>
  );
}