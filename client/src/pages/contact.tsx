import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
          title: "Message sent successfully!",
          description: result.message || "We'll get back to you soon!",
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
          title: "Failed to send message",
          description: result.message || "Please try again or contact us directly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error sending message",
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
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketplace">Marketplace</SelectItem>
                      <SelectItem value="Community">Community</SelectItem>
                      <SelectItem value="Dating">Dating</SelectItem>
                      <SelectItem value="Shipping">Shipping</SelectItem>
                      <SelectItem value="Payments">Payments</SelectItem>
                      <SelectItem value="Complaints">Complaints</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Advertisement">Advertisement</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Technical Issues">Technical Issues</SelectItem>
                      <SelectItem value="Tip">Tip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more about your inquiry..."
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
                      Upload File
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
                        Selected: {titleUpload.name}
                      </p>
                    )}
                  </div>

                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-black hover:bg-gray-800 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  You can also reach us through these channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a href="mailto:help@dedw3n.com" className="text-blue-600 hover:underline">help@dedw3n.com</a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Address</h3>
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
                    <h3 className="font-semibold">Business Hours</h3>
                    <p className="text-gray-600">
                      Open 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How do I create an account?</h4>
                  <p className="text-sm text-gray-600">
                    Visit our <Link href="/register" className="text-blue-600 hover:underline">user registration page</Link> to create your account and start exploring our platform features.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How do I list a product?</h4>
                  <p className="text-sm text-gray-600">
                    Go to our <Link href="/products" className="text-blue-600 hover:underline">marketplace section</Link> where you can browse products and access seller tools to list your items.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How do I connect with others?</h4>
                  <p className="text-sm text-gray-600">
                    Explore our <Link href="/wall" className="text-blue-600 hover:underline">community platform</Link> to connect with other users, share experiences, and build your network.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What dating features are available?</h4>
                  <p className="text-sm text-gray-600">
                    Discover meaningful connections through our <Link href="/dating" className="text-blue-600 hover:underline">dating platform</Link> with advanced matching and communication features.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Is my payment information secure?</h4>
                  <p className="text-sm text-gray-600">
                    Yes, we use industry-standard encryption and never store your payment details directly on our servers.
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