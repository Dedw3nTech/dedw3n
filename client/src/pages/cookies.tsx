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

      <PageContent pageId="cookies" />
    </>
  );
}