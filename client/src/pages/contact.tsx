import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Upload, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useLoginPrompt } from "@/hooks/use-login-prompt";

// Custom hook for Contact page Master Translation
const useContactPageTranslation = () => {
  const contactTexts = useMemo(() => [
    // Page Headers & Titles (4 texts)
    "Contact us", "Contact Information",
    "Customer Relations", "Customer Relations",
    
    // Form Fields & Labels (8 texts)
    "Name", "Your full name", "Email", "your@email.com",
    "Subject", "Select a category", "Message", "Tell us more about your inquiry...",
    
    // Subject Categories (13 texts)
    "Marketplace", "Community", "Dating", "Shipping", "Payments",
    "Complaints", "Legal", "Advertisement", "Partnership", "Network Partnership", "Technical Issues", "Tip", "Whistleblower",
    
    // File Upload (5 texts)
    "Upload File", "Selected:", "Upload File", "Choose File", "no file selected",
    
    // Action Buttons & States (4 texts)
    "Send Message", "Sending...", "Message sent successfully!", "We'll get back to you soon!",
    
    // Error Messages (3 texts)
    "Failed to send message", "Please try again or contact us directly.", 
    "Error sending message",
    
    // Contact Information (4 texts)
    "Customer Relations Email", "Global HQ Address", "Global Business hours", "Open 24 hours",
    
    // FAQ Section (6 texts)
    "Frequently Asked Questions", "How do I create an account?", "How do I list a product?",
    "How do I connect with others?", "Is my payment information secure?",
    
    // FAQ Answers (6 texts)
    "Visit our", "user registration page", "to create your account and start exploring our platform features.",
    "Go to our", "marketplace section", "where you can browse products and access seller tools to list your items.",
    
    // FAQ Additional Answers (4 texts)
    "Explore our", "community platform", "to connect with other users, share experiences, and build your network.",
    
    // FAQ Final Answers (1 text)
    "Yes, we use industry-standard encryption and never store your payment details directly on our servers.",
    
    // Disclaimer Text (5 texts)
    "By sending your message, you agree to accept the", "General Terms and Conditions of Use", "and that your data will be processed in compliance with the", "Privacy Policy", "of Dedw3n."
  ], []);
  
  const { translations, isLoading } = useMasterBatchTranslation(contactTexts);
  
  const [
    // Page Headers & Titles
    sendMessageTitle, formDescription, contactInfoTitle, channelsDescription,
    
    // Form Fields & Labels
    nameLabel, nameePlaceholder, emailLabel, emailPlaceholder,
    subjectLabel, categoryPlaceholder, messageLabel, messagePlaceholder,
    
    // Subject Categories
    marketplaceCategory, communityCategory, datingCategory, shippingCategory, paymentsCategory,
    complaintsCategory, legalCategory, advertisementCategory, partnershipCategory, networkPartnershipCategory, technicalCategory, tipCategory, whistleblowerCategory,
    
    // File Upload
    uploadFileLabel, selectedText, uploadFileText, chooseFileText, noFileSelectedText,
    
    // Action Buttons & States
    sendMessageBtn, sendingText, successTitle, successDescription,
    
    // Error Messages
    failedTitle, failedDescription, errorTitle,
    
    // Contact Information
    emailContactLabel, addressLabel, businessHoursLabel, openHoursText,
    
    // FAQ Section
    faqTitle, createAccountQuestion, listProductQuestion,
    connectQuestion, paymentSecurityQuestion,
    
    // FAQ Answers
    visitOurText, userRegistrationText, createAccountDescription,
    goToOurText, marketplaceSectionText, listProductDescription,
    
    // FAQ Additional Answers
    exploreOurText, communityPlatformText, connectDescription,
    
    // FAQ Final Answers
    paymentSecurityAnswer,
    
    // Disclaimer Text
    disclaimerStart, termsLinkText, disclaimerMiddle, privacyLinkText, disclaimerEnd
  ] = translations || contactTexts;
  
  return {
    // Page Headers
    sendMessageTitle, formDescription, contactInfoTitle, channelsDescription,
    // Form Fields
    nameLabel, nameePlaceholder, emailLabel, emailPlaceholder,
    subjectLabel, categoryPlaceholder, messageLabel, messagePlaceholder,
    // Categories
    marketplaceCategory, communityCategory, datingCategory, shippingCategory, paymentsCategory,
    complaintsCategory, legalCategory, advertisementCategory, partnershipCategory, networkPartnershipCategory, technicalCategory, tipCategory, whistleblowerCategory,
    // Upload & Actions
    uploadFileLabel, selectedText, uploadFileText, chooseFileText, noFileSelectedText,
    sendMessageBtn, sendingText, successTitle, successDescription,
    // Errors
    failedTitle, failedDescription, errorTitle,
    // Contact Info
    emailContactLabel, addressLabel, businessHoursLabel, openHoursText,
    // FAQ
    faqTitle, createAccountQuestion, listProductQuestion, connectQuestion, paymentSecurityQuestion,
    visitOurText, userRegistrationText, createAccountDescription,
    goToOurText, marketplaceSectionText, listProductDescription,
    exploreOurText, communityPlatformText, connectDescription,
    paymentSecurityAnswer,
    // Disclaimer
    disclaimerStart, termsLinkText, disclaimerMiddle, privacyLinkText, disclaimerEnd,
    isLoading
  };
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [titleUpload, setTitleUpload] = useState<File | null>(null);
  const [textUpload, setTextUpload] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { showLoginPrompt } = useLoginPrompt();
  
  // Master Translation for entire Contact page
  const {
    sendMessageTitle, formDescription, contactInfoTitle, channelsDescription,
    nameLabel, nameePlaceholder, emailLabel, emailPlaceholder,
    subjectLabel, categoryPlaceholder, messageLabel, messagePlaceholder,
    marketplaceCategory, communityCategory, datingCategory, shippingCategory, paymentsCategory,
    complaintsCategory, legalCategory, advertisementCategory, partnershipCategory, networkPartnershipCategory, technicalCategory, tipCategory, whistleblowerCategory,
    uploadFileLabel, selectedText, uploadFileText, chooseFileText, noFileSelectedText, sendMessageBtn, sendingText, successTitle, successDescription,
    failedTitle, failedDescription, errorTitle,
    emailContactLabel, addressLabel, businessHoursLabel, openHoursText,
    faqTitle, createAccountQuestion, listProductQuestion, connectQuestion, paymentSecurityQuestion,
    visitOurText, userRegistrationText, createAccountDescription,
    goToOurText, marketplaceSectionText, listProductDescription,
    exploreOurText, communityPlatformText, connectDescription,
    paymentSecurityAnswer,
    disclaimerStart, termsLinkText, disclaimerMiddle, privacyLinkText, disclaimerEnd
  } = useContactPageTranslation();

  // Auto-populate fields when whistleblower is selected
  useEffect(() => {
    if (formData.subject === "Whistleblower") {
      setFormData(prev => ({
        ...prev,
        name: "anonymous",
        email: "system@dedw3n.com"
      }));
    }
  }, [formData.subject]);

  const toggleFaq = (faqKey: string) => {
    setExpandedFaq(prev => ({
      ...prev,
      [faqKey]: !prev[faqKey]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'title' | 'text') => {
    const file = e.target.files?.[0] || null;
    if (type === 'title') {
      setTitleUpload(file);
    } else {
      setTextUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      
      if (titleUpload) {
        formDataToSend.append('titleUpload', titleUpload);
      }
      
      if (textUpload) {
        formDataToSend.append('textUpload', textUpload);
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: successTitle,
          description: result.message || successDescription,
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
        setTitleUpload(null);
        setTextUpload(null);
      } else {
        toast({
          title: failedTitle,
          description: result.message || failedDescription,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: errorTitle,
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 no-login-trigger">
      <div className="container mx-auto px-4 max-w-6xl">


        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>{sendMessageTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{nameLabel}</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={nameePlaceholder}
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="contact-form-placeholder"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{emailLabel}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={emailPlaceholder}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="contact-form-placeholder"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">{subjectLabel}</Label>
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoryPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advertisement">{advertisementCategory}</SelectItem>
                      <SelectItem value="Community">{communityCategory}</SelectItem>
                      <SelectItem value="Complaints">{complaintsCategory}</SelectItem>
                      <SelectItem value="Dating">{datingCategory}</SelectItem>
                      <SelectItem value="Legal">{legalCategory}</SelectItem>
                      <SelectItem value="Marketplace">{marketplaceCategory}</SelectItem>
                      <SelectItem value="Network Partnership">{networkPartnershipCategory}</SelectItem>
                      <SelectItem value="Partnership">{partnershipCategory}</SelectItem>
                      <SelectItem value="Payments">{paymentsCategory}</SelectItem>
                      <SelectItem value="Shipping">{shippingCategory}</SelectItem>
                      <SelectItem value="Technical Issues">{technicalCategory}</SelectItem>
                      <SelectItem value="Tip">{tipCategory}</SelectItem>
                      <SelectItem value="Whistleblower">{whistleblowerCategory}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">{messageLabel}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={messagePlaceholder}
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="contact-form-placeholder"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploadFileLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        id="title-upload"
                        type="file"
                        onChange={(e) => handleFileChange(e, 'title')}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                        className="sr-only"
                      />
                      <label
                        htmlFor="title-upload"
                        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                      >
                        <span className="text-gray-500">
                          {titleUpload ? titleUpload.name : noFileSelectedText}
                        </span>
                        <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded">
                          {chooseFileText}
                        </span>
                      </label>
                    </div>
                    {titleUpload && (
                      <p className="text-sm text-gray-600">
                        {selectedText} {titleUpload.name}
                      </p>
                    )}
                  </div>

                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-black hover:bg-gray-800 text-white"
                  disabled={isSubmitting}
                  data-testid="button-send-message"
                >
                  {isSubmitting ? sendingText : sendMessageBtn}
                </Button>
                
                {/* Disclaimer Text */}
                <div className="mt-4 text-sm text-gray-600">
                  {disclaimerStart}{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    {termsLinkText}
                  </Link>{" "}
                  {disclaimerMiddle}{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    {privacyLinkText}
                  </Link>{" "}
                  {disclaimerEnd}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{contactInfoTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold">{emailContactLabel}</h3>
                  <a href="mailto:love@dedw3n.com" className="text-black hover:underline text-sm">love@dedw3n.com</a>
                </div>

                <div>
                  <h3 className="font-semibold">{addressLabel}</h3>
                  <p className="text-gray-600 text-sm">
                    50 Essex Street<br />
                    London, England<br />
                    WC2R 3JF
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">{businessHoursLabel}</h3>
                  <p className="text-gray-600 text-sm">
                    {openHoursText}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{faqTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <button
                    onClick={() => toggleFaq('account')}
                    className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                    data-testid="button-toggle-account-faq"
                  >
                    <h4 className="font-semibold">{createAccountQuestion}</h4>
                    {expandedFaq.account ? (
                      <Minus className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  {expandedFaq.account && (
                    <p className="text-sm text-gray-600 mt-2">
                      {visitOurText} <button 
                        onClick={() => showLoginPrompt('login')} 
                        className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer inline font-inherit"
                      >
                        {userRegistrationText}
                      </button> {createAccountDescription}
                    </p>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => toggleFaq('product')}
                    className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                    data-testid="button-toggle-product-faq"
                  >
                    <h4 className="font-semibold">{listProductQuestion}</h4>
                    {expandedFaq.product ? (
                      <Minus className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  {expandedFaq.product && (
                    <p className="text-sm text-gray-600 mt-2">
                      {goToOurText} <Link href="/products" className="text-blue-600 hover:underline">{marketplaceSectionText}</Link> {listProductDescription}
                    </p>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => toggleFaq('connect')}
                    className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                    data-testid="button-toggle-connect-faq"
                  >
                    <h4 className="font-semibold">{connectQuestion}</h4>
                    {expandedFaq.connect ? (
                      <Minus className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  {expandedFaq.connect && (
                    <p className="text-sm text-gray-600 mt-2">
                      {exploreOurText} <Link href="/community" className="text-blue-600 hover:underline">{communityPlatformText}</Link> {connectDescription}
                    </p>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => toggleFaq('payment')}
                    className="flex items-center justify-between w-full text-left p-0 bg-transparent border-none cursor-pointer"
                    data-testid="button-toggle-payment-faq"
                  >
                    <h4 className="font-semibold">{paymentSecurityQuestion}</h4>
                    {expandedFaq.payment ? (
                      <Minus className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  {expandedFaq.payment && (
                    <p className="text-sm text-gray-600 mt-2">
                      {paymentSecurityAnswer}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}