import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function CookiesPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Cookie Policy - Dedw3n";
  }, []);

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-center">
            Cookie Policy
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-2xl mx-auto">
            How we use cookies and similar technologies to improve your experience.
          </p>
        </Container>
      </div>
      <PageContent pageId="cookies" />
    </>
  );
}