import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function CatalogueRulesPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Catalogue Rules - Dedw3n";
  }, []);

  return (
    <>

      <PageContent pageId="catalogue-rules" />
    </>
  );
}