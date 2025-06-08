import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

// Custom hook for Contact page Master Translation
const useContactPageTranslation = () => {
  const contactTexts = useMemo(() => [
    // Page Headers & Titles (4 texts)
    "Send us a Message", "Fill out the form below and we'll get back to you soon.",
    "Contact Information", "You can also reach us through these channels",
    
    // Form Fields & Labels (8 texts)
    "Name", "Your full name", "Email", "your@email.com",
    "Subject", "Select a category", "Message", "Tell us more about your inquiry...",
    
    // Subject Categories (11 texts)
    "Marketplace", "Community", "Dating", "Shipping", "Payments",
    "Complaints", "Legal", "Advertisement", "Partnership", "Technical Issues", "Tip",
    
    // File Upload (3 texts)
    "Upload File", "Selected:", "Upload File",
    
    // Action Buttons & States (4 texts)
    "Send Message", "Sending...", "Message sent successfully!", "We'll get back to you soon!",
    
    // Error Messages (3 texts)
    "Failed to send message", "Please try again or contact us directly.", 
    "Error sending message",
    
    // Contact Information (4 texts)
    "Email", "Address", "Business Hours", "Open 24 hours",
    
    // FAQ Section (6 texts)
    "Frequently Asked Questions", "How do I create an account?", "How do I list a product?",
    "How do I connect with others?", "What dating features are available?", "Is my payment information secure?",
    
    // FAQ Answers (6 texts)
    "Visit our", "user registration page", "to create your account and start exploring our platform features.",
    "Go to our", "marketplace section", "where you can browse products and access seller tools to list your items.",
    
    // FAQ Additional Answers (4 texts)
    "Explore our", "community platform", "to connect with other users, share experiences, and build your network.",
    "Discover meaningful connections through our",
    
    // FAQ Final Answers (3 texts)
    "dating platform", "with advanced matching and communication features.",
    "Yes, we use industry-standard encryption and never store your payment details directly on our servers."
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
    complaintsCategory, legalCategory, advertisementCategory, partnershipCategory, technicalCategory, tipCategory,
    
    // File Upload
    uploadFileLabel, selectedText, uploadFileText,
    
    // Action Buttons & States
    sendMessageBtn, sendingText, successTitle, successDescription,
    
    // Error Messages
    failedTitle, failedDescription, errorTitle,
    
    // Contact Information
    emailContactLabel, addressLabel, businessHoursLabel, openHoursText,
    
    // FAQ Section
    faqTitle, createAccountQuestion, listProductQuestion,
    connectQuestion, datingFeaturesQuestion, paymentSecurityQuestion,
    
    // FAQ Answers
    visitOurText, userRegistrationText, createAccountDescription,
    goToOurText, marketplaceSectionText, listProductDescription,
    
    // FAQ Additional Answers
    exploreOurText, communityPlatformText, connectDescription,
    discoverConnectionsText,
    
    // FAQ Final Answers
    datingPlatformText, datingFeaturesDescription,
    paymentSecurityAnswer
  ] = translations || contactTexts;
  
  return {
    // Page Headers
    sendMessageTitle, formDescription, contactInfoTitle, channelsDescription,
    // Form Fields
    nameLabel, nameePlaceholder, emailLabel, emailPlaceholder,
    subjectLabel, categoryPlaceholder, messageLabel, messagePlaceholder,
    // Categories
    marketplaceCategory, communityCategory, datingCategory, shippingCategory, paymentsCategory,
    complaintsCategory, legalCategory, advertisementCategory, partnershipCategory, technicalCategory, tipCategory,
    // Upload & Actions
    uploadFileLabel, selectedText, uploadFileText,
    sendMessageBtn, sendingText, successTitle, successDescription,
    // Errors
    failedTitle, failedDescription, errorTitle,
    // Contact Info
    emailContactLabel, addressLabel, businessHoursLabel, openHoursText,
    // FAQ
    faqTitle, createAccountQuestion, listProductQuestion, connectQuestion, datingFeaturesQuestion, paymentSecurityQuestion,
    visitOurText, userRegistrationText, createAccountDescription,
    goToOurText, marketplaceSectionText, listProductDescription,
    exploreOurText, communityPlatformText, connectDescription, discoverConnectionsText,
    datingPlatformText, datingFeaturesDescription, paymentSecurityAnswer,
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
  const { toast } = useToast();
  
  // Master Translation for entire Contact page
  const {
    sendMessageTitle, formDescription, contactInfoTitle, channelsDescription,
    nameLabel, nameePlaceholder, emailLabel, emailPlaceholder,
    subjectLabel, categoryPlaceholder, messageLabel, messagePlaceholder,
    marketplaceCategory, communityCategory, datingCategory, shippingCategory, paymentsCategory,
    complaintsCategory, legalCategory, advertisementCategory, partnershipCategory, technicalCategory, tipCategory,
    uploadFileLabel, selectedText, sendMessageBtn, sendingText, successTitle, successDescription,
    failedTitle, failedDescription, errorTitle,
    emailContactLabel, addressLabel, businessHoursLabel, openHoursText,
    faqTitle, createAccountQuestion, listProductQuestion, connectQuestion, datingFeaturesQuestion, paymentSecurityQuestion,
    visitOurText, userRegistrationText, createAccountDescription,
    goToOurText, marketplaceSectionText, listProductDescription,
    exploreOurText, communityPlatformText, connectDescription, discoverConnectionsText,
    datingPlatformText, datingFeaturesDescription, paymentSecurityAnswer
  } = useContactPageTranslation();

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">


        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>{sendMessageTitle}</CardTitle>
              <CardDescription>
                {formDescription}
              </CardDescription>
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
                      <SelectItem value="Marketplace">{marketplaceCategory}</SelectItem>
                      <SelectItem value="Community">{communityCategory}</SelectItem>
                      <SelectItem value="Dating">{datingCategory}</SelectItem>
                      <SelectItem value="Shipping">{shippingCategory}</SelectItem>
                      <SelectItem value="Payments">{paymentsCategory}</SelectItem>
                      <SelectItem value="Complaints">{complaintsCategory}</SelectItem>
                      <SelectItem value="Legal">{legalCategory}</SelectItem>
                      <SelectItem value="Advertisement">{advertisementCategory}</SelectItem>
                      <SelectItem value="Partnership">{partnershipCategory}</SelectItem>
                      <SelectItem value="Technical Issues">{technicalCategory}</SelectItem>
                      <SelectItem value="Tip">{tipCategory}</SelectItem>
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
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploadFileLabel}
                    </Label>
                    <Input
                      id="title-upload"
                      type="file"
                      onChange={(e) => handleFileChange(e, 'title')}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className="cursor-pointer"
                    />
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
                >
                  {isSubmitting ? sendingText : sendMessageBtn}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{contactInfoTitle}</CardTitle>
                <CardDescription>
                  {channelsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">{emailContactLabel}</h3>
                    <a href="mailto:help@dedw3n.com" className="text-blue-600 hover:underline">help@dedw3n.com</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">{addressLabel}</h3>
                    <p className="text-gray-600">
                      50 Essex Street<br />
                      London, England<br />
                      WC2R 3JF
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">{businessHoursLabel}</h3>
                    <p className="text-gray-600">
                      {openHoursText}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{faqTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{createAccountQuestion}</h4>
                  <p className="text-sm text-gray-600">
                    {visitOurText} <Link href="/register" className="text-blue-600 hover:underline">{userRegistrationText}</Link> {createAccountDescription}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{listProductQuestion}</h4>
                  <p className="text-sm text-gray-600">
                    {goToOurText} <Link href="/products" className="text-blue-600 hover:underline">{marketplaceSectionText}</Link> {listProductDescription}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{connectQuestion}</h4>
                  <p className="text-sm text-gray-600">
                    {exploreOurText} <Link href="/wall" className="text-blue-600 hover:underline">{communityPlatformText}</Link> {connectDescription}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{datingFeaturesQuestion}</h4>
                  <p className="text-sm text-gray-600">
                    {discoverConnectionsText} <Link href="/dating" className="text-blue-600 hover:underline">{datingPlatformText}</Link> {datingFeaturesDescription}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{paymentSecurityQuestion}</h4>
                  <p className="text-sm text-gray-600">
                    {paymentSecurityAnswer}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}