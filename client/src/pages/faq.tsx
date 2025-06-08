import { Container } from "@/components/ui/container";
import { useEffect, useMemo } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQPage() {
  const { currentLanguage } = useLanguage();
  
  // Set document title on mount
  useEffect(() => {
    document.title = "FAQ - Dedw3n";
  }, []);

  // Master Translation mega-batch for entire FAQ page (45+ texts)
  const faqTexts = useMemo(() => [
    // Page Headers (2 texts)
    "Frequently Asked Questions",
    "Find answers to common questions about our platform, services, and policies.",
    
    // General Questions Section (8 texts)
    "General Questions",
    "What is Dedw3n?",
    "Dedw3n is a comprehensive multi-vendor social marketplace and dating platform that creates meaningful digital connections through intelligent, adaptive social experiences. Our platform provides advanced financial interactions with seamless payment mechanisms, including e-wallet integration, real-time transaction processing, and intuitive user interfaces for managing digital transactions.",
    "How do I create an account?",
    "You can create an account by clicking on the \"Sign Up\" button in the top right corner of the page. Follow the instructions to complete your profile.",
    "Is my personal information secure?",
    "Yes, we use industry-standard encryption and security measures to protect your personal information. We never share your data without your explicit consent.",
    
    // Marketplace Section (12 texts)
    "Marketplace",
    "What's the difference between C2C, B2C, and B2B marketplaces?",
    "C2C (Consumer-to-Consumer) is for individual users selling to other individuals. B2C (Business-to-Consumer) is for businesses selling to individual customers. B2B (Business-to-Business) is for businesses selling products or services to other businesses.",
    "How do I become a vendor?",
    "To become a vendor, click on \"Become a Vendor\" in the main menu and complete the vendor registration process. You'll need to provide business information and verify your identity.",
    "What are the seller fees?",
    "We charge a small commission on successful sales. The exact percentage depends on your product category and seller tier. Premium vendors enjoy reduced fees.",
    "How do payments work?",
    "We support multiple payment methods including credit cards, PayPal, and digital wallets. Payments are processed securely through our integrated payment system.",
    "What is the return policy?",
    "Return policies vary by vendor and product type. Each product listing shows the specific return policy. Generally, returns are accepted within 30 days of purchase.",
    "How do I track my orders?",
    "You can track your orders in your account dashboard. You'll receive email updates and can view real-time tracking information for shipped items.",
    
    // Community Section (8 texts)
    "Community",
    "How do I join the community?",
    "Simply create an account and you automatically gain access to our community features. You can post updates, share experiences, and connect with other users.",
    "What are community guidelines?",
    "Our community guidelines promote respectful interaction, authentic content, and meaningful connections. Harassment, spam, and inappropriate content are not allowed.",
    "How do I report inappropriate content?",
    "Use the report button next to any post or message. Our moderation team reviews all reports within 24 hours and takes appropriate action.",
    "Can I create groups or events?",
    "Yes, verified users can create groups and organize events. This feature helps build local communities and interest-based connections.",
    
    // Dating Section (8 texts)
    "Dating & Connections",
    "How does the matching system work?",
    "Our intelligent matching algorithm considers your preferences, interests, location, and compatibility factors to suggest meaningful connections.",
    "Is the dating feature safe?",
    "Yes, we have robust safety features including profile verification, reporting tools, and privacy controls. You control who can see your profile and contact you.",
    "How do I verify my dating profile?",
    "Upload a government-issued ID and take a verification selfie. Verified profiles get a blue checkmark and are prioritized in matching.",
    "What privacy controls are available?",
    "You can control profile visibility, manage who can message you, and set location sharing preferences. All settings are in your privacy dashboard.",
    
    // Technical Support (6 texts)
    "Technical Support",
    "I'm having trouble with the app. What should I do?",
    "First, try refreshing the page or restarting the app. If issues persist, contact our support team with details about the problem you're experiencing.",
    "How do I reset my password?",
    "Click \"Forgot Password\" on the login page and enter your email address. You'll receive a reset link within a few minutes.",
    "Why can't I upload images?",
    "Ensure your images are under 5MB and in JPG, PNG, or GIF format. Clear your browser cache if the problem continues."
  ], []);

  const { translations, isLoading } = useMasterBatchTranslation(faqTexts);
  
  if (isLoading || !translations || translations.length === 0) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>;
  }
  
  const [
    // Page Headers
    pageTitle, pageDescription,
    
    // General Questions
    generalTitle, whatIsDedw3nQ, whatIsDedw3nA, howCreateAccountQ, howCreateAccountA,
    isDataSecureQ, isDataSecureA,
    
    // Marketplace
    marketplaceTitle, marketplaceDiffQ, marketplaceDiffA, becomeVendorQ, becomeVendorA,
    sellerFeesQ, sellerFeesA, paymentsWorkQ, paymentsWorkA, returnPolicyQ, returnPolicyA,
    trackOrdersQ, trackOrdersA,
    
    // Community
    communityTitle, joinCommunityQ, joinCommunityA, communityGuidelinesQ, communityGuidelinesA,
    reportContentQ, reportContentA, createGroupsQ, createGroupsA,
    
    // Dating
    datingTitle, matchingSystemQ, matchingSystemA, datingFeatureSafeQ, datingFeatureSafeA,
    verifyProfileQ, verifyProfileA, privacyControlsQ, privacyControlsA,
    
    // Technical Support
    technicalTitle, troubleAppQ, troubleAppA, resetPasswordQ, resetPasswordA,
    uploadImagesQ, uploadImagesA
  ] = translations;

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <Container className="py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-center">
            {pageTitle}
          </h1>
          <p className="mt-4 text-lg text-gray-600 text-center max-w-2xl mx-auto">
            {pageDescription}
          </p>
        </Container>
      </div>
      
      <Container className="py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* General Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{generalTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is-dedw3n">
                  <AccordionTrigger className="text-left">{whatIsDedw3nQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {whatIsDedw3nA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="create-account">
                  <AccordionTrigger className="text-left">{howCreateAccountQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {howCreateAccountA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="data-security">
                  <AccordionTrigger className="text-left">{isDataSecureQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {isDataSecureA}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Marketplace */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{marketplaceTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="marketplace-types">
                  <AccordionTrigger className="text-left">{marketplaceDiffQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {marketplaceDiffA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="become-vendor">
                  <AccordionTrigger className="text-left">{becomeVendorQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {becomeVendorA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="seller-fees">
                  <AccordionTrigger className="text-left">{sellerFeesQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {sellerFeesA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="payments">
                  <AccordionTrigger className="text-left">{paymentsWorkQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {paymentsWorkA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="returns">
                  <AccordionTrigger className="text-left">{returnPolicyQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {returnPolicyA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tracking">
                  <AccordionTrigger className="text-left">{trackOrdersQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {trackOrdersA}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Community */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{communityTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="join-community">
                  <AccordionTrigger className="text-left">{joinCommunityQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {joinCommunityA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="guidelines">
                  <AccordionTrigger className="text-left">{communityGuidelinesQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {communityGuidelinesA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="report-content">
                  <AccordionTrigger className="text-left">{reportContentQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {reportContentA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="create-groups">
                  <AccordionTrigger className="text-left">{createGroupsQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {createGroupsA}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Dating & Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{datingTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="matching-system">
                  <AccordionTrigger className="text-left">{matchingSystemQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {matchingSystemA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="dating-safety">
                  <AccordionTrigger className="text-left">{datingFeatureSafeQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {datingFeatureSafeA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="profile-verification">
                  <AccordionTrigger className="text-left">{verifyProfileQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {verifyProfileA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-controls">
                  <AccordionTrigger className="text-left">{privacyControlsQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {privacyControlsA}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Technical Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{technicalTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="app-trouble">
                  <AccordionTrigger className="text-left">{troubleAppQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {troubleAppA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="reset-password">
                  <AccordionTrigger className="text-left">{resetPasswordQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {resetPasswordA}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="upload-images">
                  <AccordionTrigger className="text-left">{uploadImagesQ}</AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {uploadImagesA}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

        </div>
      </Container>
    </>
  );
}