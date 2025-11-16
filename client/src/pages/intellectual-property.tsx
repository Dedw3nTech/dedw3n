import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function IntellectualPropertyPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Intellectual Property Claims Policy - Dedw3n";
  }, []);

  return (
    <>
      <PageContent pageId="intellectual-property" />
    </>
  );
}
