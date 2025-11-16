import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function AboutUsPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "About Us - Dedw3n";
  }, []);

  return (
    <>
      <PageContent pageId="about-us" />
    </>
  );
}