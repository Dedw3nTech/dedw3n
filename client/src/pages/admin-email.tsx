import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminEmail() {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/brevo/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "API Key Configured",
          description: "Email functionality is now enabled for the contact form",
        });
        setApiKey("");
      } else {
        toast({
          title: "Configuration Failed",
          description: result.message || "Please check your API key and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to configure email service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Configure your Brevo API key to enable email functionality for the contact form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Brevo API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Brevo API key (starts with xkeysib-)"
                  required
                />
                <p className="text-sm text-gray-600">
                  Get your API key from{" "}
                  <a 
                    href="https://app.brevo.com/settings/keys/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Brevo Settings
                  </a>
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || !apiKey.trim()}
                className="w-full"
              >
                {isSubmitting ? "Configuring..." : "Configure Email Service"}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">How to get your Brevo API Key:</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Sign up for a free Brevo account at brevo.com</li>
                <li>2. Go to Settings → API Keys in your Brevo dashboard</li>
                <li>3. Create a new API key with full permissions</li>
                <li>4. Copy the key (it starts with "xkeysib-") and paste it above</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}