import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function FAQPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "FAQ - Dedw3n";
  }, []);

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-center">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-2xl mx-auto">
            Find answers to common questions about our platform, services, and policies.
          </p>
        </Container>
      </div>
      <PageContent pageId="faq" />
    </>
  );
}