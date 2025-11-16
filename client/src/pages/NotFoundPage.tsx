import { Link } from "wouter";
import { useEffect, useMemo } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export default function NotFoundPage() {
  // Translation array for 404 page
  const notFoundTexts = useMemo(() => [
    "Page Not Found",
    "The page you are seeking is no longer available. Please return to the",
    "homepage"
  ], []);

  const { translations: translatedTexts } = useMasterBatchTranslation(notFoundTexts);

  // Helper function to get translated text
  const t = (text: string): string => {
    if (Array.isArray(translatedTexts)) {
      const index = notFoundTexts.indexOf(text);
      return index !== -1 ? translatedTexts[index] || text : text;
    }
    return text;
  };

  useEffect(() => {
    // Set proper 404 status in document title for SEO
    document.title = `404 - ${t("Page Not Found")} | Dedw3n`;
    
    // Add canonical URL for 404 page
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', window.location.href);
    }
  }, [translatedTexts]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mt-4">{t("Page Not Found")}</h2>
          <p className="text-gray-600 mt-6 text-lg">
            {t("The page you are seeking is no longer available. Please return to the")} <Link href="/" className="text-gray-500 italic underline font-medium" data-testid="link-homepage">{t("homepage")}</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}