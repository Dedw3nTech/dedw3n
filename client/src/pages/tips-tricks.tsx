import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function TipsTricksPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Tips & Tricks - Dedw3n";
  }, []);

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-center">
            Tips & Tricks
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-2xl mx-auto">
            Safety guidelines and helpful tips for a secure and enjoyable experience on our platform.
          </p>
        </Container>
      </div>
      <PageContent pageId="tips-tricks" />
    </>
  );
}