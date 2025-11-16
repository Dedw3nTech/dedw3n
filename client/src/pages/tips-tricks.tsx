import { Container } from "@/components/ui/container";
import PageContent from "@/components/layout/PageContent";
import { useEffect } from "react";
import { useMasterTranslation } from "@/hooks/use-master-translation";

export default function TipsTricksPage() {
  const { translateText } = useMasterTranslation();
  
  // Set document title on mount
  useEffect(() => {
    document.title = `${translateText('Tips & Tricks')} - Dedw3n`;
  }, [translateText]);

  return (
    <>

      <PageContent pageId="tips-tricks" />
    </>
  );
}