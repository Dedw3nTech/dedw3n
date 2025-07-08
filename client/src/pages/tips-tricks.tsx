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

      <PageContent pageId="tips-tricks" />
    </>
  );
}