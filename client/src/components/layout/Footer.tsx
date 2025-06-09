import { Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useCookieConsent } from "@/components/CookieConsentProvider";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Cookie } from "lucide-react";

function FooterContent() {
  const { isFirstVisit, acceptAll } = useCookieConsent();
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);

  useEffect(() => {
    if (isFirstVisit) {
      setShowPrivacyBanner(true);
    }
  }, [isFirstVisit]);

  // Define all footer texts with stable references
  const footerTexts = useMemo(() => [
    "All rights reserved.",
    "Privacy Policy",
    "Terms of Service", 
    "Cookie Policy",
    "Community Guidelines",
    "Contact Us",
    "FAQ",
    "Shipping",
    "Partnerships",
    "Download our mobile app",
    "Download on the",
    "App Store",
    "Get it on",
    "Google Play",
    "is a British Company registered in England, Wales and Scotland under registration number",
    "whose registered office is situated",
    "Our bank is registered with HSBC UK IBAN",
    "our sole official website is",
    // Privacy banner texts
    "Your Privacy Matters",
    "We use cookies to enhance your experience and protect your data",
    "Essential Cookies",
    "Required for site functionality",
    "Analytics Cookies", 
    "Help us improve our service",
    "Marketing Cookies",
    "Personalized content and ads",
    "Accept All Cookies",
    "Cookie Settings",
    "Learn More"
  ], []);

  const { translations } = useMasterBatchTranslation(footerTexts);

  // Extract individual translations from array using Master Translation System
  const [
    allRightsReservedText, privacyPolicyText, termsOfServiceText, cookiePolicyText,
    communityGuidelinesText, contactUsText, faqText, shippingText, partnershipsText,
    downloadMobileAppText, downloadOnTheText, appStoreText, getItOnText, googlePlayText,
    britishCompanyText, registeredOfficeText, bankRegisteredText, officialWebsiteText,
    privacyMattersTitleText, privacyMatterDescText, essentialCookiesText, essentialCookiesDescText,
    analyticsCookiesText, analyticsCookiesDescText, marketingCookiesText, marketingCookiesDescText,
    acceptAllText, cookieSettingsText, learnMoreText
  ] = translations || footerTexts;

  const handleAcceptAll = () => {
    acceptAll();
    setShowPrivacyBanner(false);
  };

  const handleLearnMore = () => {
    window.location.href = '/privacy';
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      {/* Privacy & Cookie banner for first-time visitors */}
      {showPrivacyBanner && (
        <div className="bg-gray-50 border-b border-gray-200 py-4 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{privacyMattersTitleText}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{privacyMatterDescText}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <Cookie className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-900">{essentialCookiesText}</span>
                      <p className="text-xs text-gray-600">{essentialCookiesDescText}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Eye className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-900">{analyticsCookiesText}</span>
                      <p className="text-xs text-gray-600">{analyticsCookiesDescText}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-900">{marketingCookiesText}</span>
                      <p className="text-xs text-gray-600">{marketingCookiesDescText}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-fit">
                <Button 
                  size="sm" 
                  onClick={handleAcceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {acceptAllText}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleLearnMore}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {learnMoreText}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">


        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-4 md:mb-0">© 2025 <span className="text-black font-medium">Dedw3n Ltd.</span> {allRightsReservedText}</p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-3 gap-y-2">
              <Link href="/privacy" className="text-xs text-gray-600 hover:text-primary">{privacyPolicyText}</Link>
              <Link href="/terms" className="text-xs text-gray-600 hover:text-primary">{termsOfServiceText}</Link>
              <Link href="/cookies" className="text-xs text-gray-600 hover:text-primary">{cookiePolicyText}</Link>
              <Link href="/community-guidelines" className="text-xs text-gray-600 hover:text-primary">{communityGuidelinesText}</Link>
              <Link href="/contact" className="text-xs text-gray-600 hover:text-primary">{contactUsText}</Link>
              <Link href="/faq" className="text-xs text-gray-600 hover:text-primary">{faqText}</Link>
              <Link href="/shipping" className="text-xs text-gray-600 hover:text-primary">{shippingText}</Link>
              <Link href="/partnerships" className="text-xs text-gray-600 hover:text-primary">{partnershipsText}</Link>
            </div>
          </div>
          
          {/* App Download Section */}
          <div className="flex flex-col md:flex-row justify-center md:justify-start items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600 mb-2 text-center md:text-left">{downloadMobileAppText}</p>
              <div className="flex space-x-3 justify-center md:justify-start">
                <a
                  href="#"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Download on the App Store"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs leading-tight">{downloadOnTheText}</div>
                    <div className="text-sm font-semibold leading-tight">{appStoreText}</div>
                  </div>
                </a>
                
                <a
                  href="#"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Get it on Google Play"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs leading-tight">{getItOnText}</div>
                    <div className="text-sm font-semibold leading-tight">{googlePlayText}</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          

          
          <p className="text-xs text-gray-500 text-center md:text-left">
            <span className="text-black font-medium">Dedw3n Ltd.</span> {britishCompanyText} <span className="font-medium">15930281</span>, {registeredOfficeText} <span className="font-medium">50 Essex Street, London, England, WC2R3JF</span>.
          </p>
          <p className="text-xs text-gray-500 text-center md:text-left">
            {bankRegisteredText} <span className="font-medium">GB79 HBUK 4003 2782 3984 94</span> (BIC <span className="font-medium">BUKGB4B</span>), {officialWebsiteText} <a href="https://www.dedw3n.com" className="text-gray-500 hover:underline" target="_blank" rel="noopener noreferrer">www.dedw3n.com</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  return (
    <ErrorBoundary fallback={<div className="bg-white border-t border-gray-200 mt-10 p-4 text-center text-gray-500">Footer loading...</div>}>
      <FooterContent />
    </ErrorBoundary>
  );
}
