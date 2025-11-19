import { Link } from "wouter";
import { useMemo } from "react";
import { Globe } from "lucide-react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useLocation } from "@/hooks/use-location";
import { useLocationConsent } from "@/hooks/use-location-consent";
import ErrorBoundary from "@/components/ui/error-boundary";
import { WeightUnitSelector } from "@/components/ui/weight-unit-selector";
import { DimensionUnitSelector } from "@/components/ui/dimension-unit-selector";
import { DistanceUnitSelector } from "@/components/ui/distance-unit-selector";

function FooterContent() {
  const { consentStatus } = useLocationConsent();
  const { location, isLoading: locationLoading } = useLocation(consentStatus === 'granted');
  
  // Define all footer texts with stable references
  const footerTexts = useMemo(() => [
    "All rights reserved.",
    "Network Partnership",
    "Affiliate Partnership",
    "Privacy Policy",
    "Terms of Service", 
    "Cookie Policy",
    "Community Guidelines",
    "Contact Us",
    "FAQ",
    "Catalogue Rules",
    "Tips & Tricks",
    "Payment Options",
    "Delivery & Return Options",
    "How to use",

    "Download our mobile app",
    "Download on the",
    "App Store",
    "Get it on",
    "Google Play",
    "is a British Company registered in England, Wales and Scotland under registration number",
    "whose registered office is situated",
    "Our bank is registered with HSBC UK IBAN",
    "our sole official website is",

    // New footer section headers and links
    "Gift Cards",
    "Help",
    "Legal",
    "Dedw3n",
    "About Us",
    "Code Of Ethics",
    "Careers",
    "Location",
    
    // Location button texts
    "Location / Country:",
    "Loading...",
    "Unknown",
    "Education Policy",
    "Intel Prop Claims Policy",
    "Ads Terms of Service"
  ], []);

  const { translations } = useMasterBatchTranslation(footerTexts);
  
  // Translate country name dynamically
  const countryName = location?.country || 'Unknown';
  const { translations: countryTranslations } = useMasterBatchTranslation([countryName]);

  // Extract individual translations from array using Master Translation System
  const [
    allRightsReservedText, networkPartnershipsText, affiliatePartnershipsText, privacyPolicyText, termsOfServiceText, cookiePolicyText,
    communityGuidelinesText, contactUsText, faqText, catalogueRulesText, tipsTricksText, paymentOptionsText, deliveryReturnsText, howToUseText,
    downloadMobileAppText, downloadOnTheText, appStoreText, getItOnText, googlePlayText,
    britishCompanyText, registeredOfficeText, bankRegisteredText, officialWebsiteText,
    giftCardsText, helpText, legalText, dedw3nText, aboutUsText, codeOfEthicsText, careersText, locationText,
    locationCountryText, loadingText, unknownText, educationPolicyText, intellectualPropertyText, advertisementTermsText
  ] = translations || footerTexts;
  
  // Get translated country name
  const translatedCountryName = countryTranslations?.[0] || countryName;
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container mx-auto px-4 py-8">


        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col space-y-4">
          <div className="flex flex-wrap justify-center md:justify-end gap-x-3 gap-y-2 items-center">
            <DistanceUnitSelector />
            <span className="text-xs text-gray-400">|</span>
            <WeightUnitSelector />
            <DimensionUnitSelector />
          </div>
          
          {/* Footer Links Sections */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-8">
            {/* Dedw3n Section */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-3">{dedw3nText}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about-us" className="text-xs text-gray-600 hover:text-primary">
                    {aboutUsText}
                  </Link>
                </li>
                <li>
                  <Link href="/code-of-ethics" className="text-xs text-gray-600 hover:text-primary">
                    {codeOfEthicsText}
                  </Link>
                </li>
                <li>
                  <Link href="/network-partnership-resources" className="text-xs text-gray-600 hover:text-primary">
                    {networkPartnershipsText}
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-xs text-gray-600 hover:text-primary">
                    {affiliatePartnershipsText}
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-xs text-gray-600 hover:text-primary">
                    {careersText}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Help Section */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-3">{helpText}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-xs text-gray-600 hover:text-primary">
                    {contactUsText}
                  </Link>
                </li>
                <li>
                  <Link href="/gift-cards" className="text-xs text-gray-600 hover:text-primary">
                    {giftCardsText}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-xs text-gray-600 hover:text-primary">
                    {faqText}
                  </Link>
                </li>
                <li>
                  <Link href="/tips-tricks" className="text-xs text-gray-600 hover:text-primary">
                    {tipsTricksText}
                  </Link>
                </li>
                <li>
                  <Link href="/payment-options" className="text-xs text-gray-600 hover:text-primary" data-testid="link-payment-options">
                    {paymentOptionsText}
                  </Link>
                </li>
                <li>
                  <Link href="/delivery-returns" className="text-xs text-gray-600 hover:text-primary" data-testid="link-delivery-returns">
                    {deliveryReturnsText}
                  </Link>
                </li>
                <li>
                  <Link href="/how-to-use" className="text-xs text-gray-600 hover:text-primary" data-testid="link-how-to-use">
                    {howToUseText}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-3">{legalText}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-xs text-gray-600 hover:text-primary">
                    {termsOfServiceText}
                  </Link>
                </li>
                <li>
                  <Link href="/advertisement-terms" className="text-xs text-gray-600 hover:text-primary" data-testid="link-advertisement-terms">
                    {advertisementTermsText}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs text-gray-600 hover:text-primary">
                    {privacyPolicyText}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-xs text-gray-600 hover:text-primary">
                    {cookiePolicyText}
                  </Link>
                </li>
                <li>
                  <Link href="/education-policy" className="text-xs text-gray-600 hover:text-primary" data-testid="link-education-policy">
                    {educationPolicyText}
                  </Link>
                </li>
                <li>
                  <Link href="/intellectual-property" className="text-xs text-gray-600 hover:text-primary" data-testid="link-intellectual-property">
                    {intellectualPropertyText}
                  </Link>
                </li>
                <li>
                  <Link href="/community-guidelines" className="text-xs text-gray-600 hover:text-primary">
                    {communityGuidelinesText}
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue-rules" className="text-xs text-gray-600 hover:text-primary">
                    {catalogueRulesText}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* App Download Section */}
          <div className="flex flex-col md:flex-row justify-center md:justify-start items-center py-6">
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
          
          {/* Location Section */}
          <div className="flex justify-center md:justify-start py-4">
            <div 
              className="text-xs text-gray-600 flex items-center gap-1"
              title={location ? `${location.city}, ${location.region}` : loadingText}
              data-testid="button-location"
            >
              <Globe className="w-3 h-3" />
              {locationLoading ? (
                <>{locationCountryText} {loadingText}</>
              ) : (
                <>{locationCountryText} <span className="font-bold">{translatedCountryName}</span></>
              )}
            </div>
          </div>
          
          {/* Copyright Section - Bottom Right */}
          <div className="flex justify-center md:justify-end pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">© 2025 <span className="text-black font-medium">Dedw3n</span> {allRightsReservedText}</p>
          </div>
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
