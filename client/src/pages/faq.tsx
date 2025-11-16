import { Container } from "@/components/ui/container";
import { useEffect, useMemo, useState } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Minus } from "lucide-react";

export default function FAQPage() {
  const { currentLanguage } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState<Record<string, boolean>>({});
  
  // Set document title on mount
  useEffect(() => {
    document.title = "FAQ - Dedw3n";
  }, []);

  const toggleFaq = (faqKey: string) => {
    setExpandedFaq(prev => ({
      ...prev,
      [faqKey]: !prev[faqKey]
    }));
  };

  // Master Translation for old FAQ content
  const faqTexts = useMemo(() => [
    // Page Header
    "Frequently Asked Questions",
    
    // General Questions Section
    "General Questions",
    "What is Dedw3n?",
    "As contemporary artisan developer est. 2024 in London, we embody the dedication, inventiveness, and skill of traditional craftsmen. Rather than merely writing functional code, we prioritize developing meticulously crafted, high-quality, and scalable software solutions that provide outstanding user experiences",
    "How do I create an account?",
    "You can create an account by clicking on the \"Sign Up\" button in the top right corner of the page. Follow the instructions to complete your profile.",
    
    // Marketplace Section
    "Marketplace",
    "What's the difference between C2C, B2C, and B2B marketplaces?",
    "C2C (Consumer-to-Consumer) is for individual users selling to other individuals. B2C (Business-to-Consumer) is for businesses selling to individual customers. B2B (Business-to-Business) is for businesses selling products or services to other businesses.",
    "How do I become a vendor?",
    "You can become a vendor by navigating to the \"Become a Vendor\" page and following the application process. Once approved, you'll be able to list products and manage your store.",
    
    // Payments & Security Section
    "Payments & Security",
    "What payment methods are accepted?",
    "We accept various payment methods including credit/debit cards, PayPal, e-wallet, and for African customers, we support mobile money transactions.",
    "Is my personal information secure?",
    "Yes, we take security seriously. All personal and payment information is encrypted and processed according to industry-standard security protocols.",
    
    // Social Features Section
    "Social Features",
    "How do communities work?",
    "Communities are groups of users with shared interests. You can join existing communities or create your own. Some communities may offer tiered memberships with exclusive content and benefits.",
    "Can I monetize my content?",
    "Yes, creators can monetize content through various methods including premium subscriptions, direct sales, and exclusive community memberships."
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(faqTexts);
  
  if (isLoading || !translations || translations.length === 0) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>;
  }
  
  const [
    // Page Header
    pageTitle,
    
    // General Questions
    generalTitle, whatIsDedw3nQ, whatIsDedw3nA, howCreateAccountQ, howCreateAccountA,
    
    // Marketplace
    marketplaceTitle, marketplaceDiffQ, marketplaceDiffA, becomeVendorQ, becomeVendorA,
    
    // Payments & Security
    paymentsTitle, paymentMethodsQ, paymentMethodsA, isDataSecureQ, isDataSecureA,
    
    // Social Features
    socialTitle, communitiesWorkQ, communitiesWorkA, monetizeContentQ, monetizeContentA
  ] = translations;

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-left">
            {pageTitle}
          </h1>
        </Container>
      </div>
      
      <Container className="py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* General Questions */}
          <div>
            <h2 className="text-2xl font-bold mb-6">{generalTitle}</h2>
            <div className="space-y-6">
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('what-is-dedw3n')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-what-is-dedw3n"
                >
                  <h3 className="text-lg font-semibold">{whatIsDedw3nQ}</h3>
                  {expandedFaq['what-is-dedw3n'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['what-is-dedw3n'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{whatIsDedw3nA}</p>
                )}
              </div>
              
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('how-create-account')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-how-create-account"
                >
                  <h3 className="text-lg font-semibold">{howCreateAccountQ}</h3>
                  {expandedFaq['how-create-account'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['how-create-account'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{howCreateAccountA}</p>
                )}
              </div>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h2 className="text-2xl font-bold mb-6">{marketplaceTitle}</h2>
            <div className="space-y-6">
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('marketplace-diff')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-marketplace-diff"
                >
                  <h3 className="text-lg font-semibold">{marketplaceDiffQ}</h3>
                  {expandedFaq['marketplace-diff'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['marketplace-diff'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{marketplaceDiffA}</p>
                )}
              </div>
              
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('become-vendor')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-become-vendor"
                >
                  <h3 className="text-lg font-semibold">{becomeVendorQ}</h3>
                  {expandedFaq['become-vendor'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['become-vendor'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{becomeVendorA}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payments & Security */}
          <div>
            <h2 className="text-2xl font-bold mb-6">{paymentsTitle}</h2>
            <div className="space-y-6">
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('payment-methods')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-payment-methods"
                >
                  <h3 className="text-lg font-semibold">{paymentMethodsQ}</h3>
                  {expandedFaq['payment-methods'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['payment-methods'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{paymentMethodsA}</p>
                )}
              </div>
              
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('data-secure')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-data-secure"
                >
                  <h3 className="text-lg font-semibold">{isDataSecureQ}</h3>
                  {expandedFaq['data-secure'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['data-secure'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{isDataSecureA}</p>
                )}
              </div>
            </div>
          </div>

          {/* Social Features */}
          <div>
            <h2 className="text-2xl font-bold mb-6">{socialTitle}</h2>
            <div className="space-y-6">
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('communities-work')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-communities-work"
                >
                  <h3 className="text-lg font-semibold">{communitiesWorkQ}</h3>
                  {expandedFaq['communities-work'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['communities-work'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{communitiesWorkA}</p>
                )}
              </div>
              
              <div className="faq-item">
                <button
                  onClick={() => toggleFaq('monetize-content')}
                  className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                  data-testid="button-toggle-monetize-content"
                >
                  <h3 className="text-lg font-semibold">{monetizeContentQ}</h3>
                  {expandedFaq['monetize-content'] ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {expandedFaq['monetize-content'] && (
                  <p className="text-gray-600 leading-relaxed mt-3">{monetizeContentA}</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </Container>
    </>
  );
}