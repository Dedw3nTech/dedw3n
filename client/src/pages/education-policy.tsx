import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";

export default function EducationPolicyPage() {
  // Set document title on mount
  useEffect(() => {
    document.title = "Dedw3n Education Policy - Dedw3n";
  }, []);

  return (
    <>
      <PageContent pageId="education-policy" />
    </>
  );
}
