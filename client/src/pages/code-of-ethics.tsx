import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function CodeOfEthicsPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Code of Ethics - Dedw3n";
  }, []);

  return (
    <>
      <PageContent pageId="code-of-ethics" />
    </>
  );
}