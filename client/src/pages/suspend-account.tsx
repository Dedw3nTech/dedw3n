import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function SuspendAccountPage() {
  usePageTitle({ title: "Suspend Account" });
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Translation strings for the suspend account page
  const suspendTexts = useMemo(() => [
    "Suspend Account",
    "Back to Settings",
    "Account Suspension",
    "Temporarily suspending your account will deactivate it. You can easily reactivate your account after 24 hours by logging back in.",
    "Impact on Your Profile and Previous Activity on Dedw3n",
    "Your profile will be hidden from everyone, including your connections.",
    "Your previous activity will remain visible, but your profile photo and name will be removed.",
    "Other users won't be able to find or message you.",
    "Effects on Your Subscriptions and Licenses",
    "Subscription:",
    "Any active subscriptions will be automatically canceled when your account is suspended. If you decide to reactivate, you might lose access to discounted pricing. Additionally, if you purchased your Premium subscription through Apple, it will also be canceled with the suspension. To prevent any future billing, you'll need to cancel the subscription directly with your financial institution.",
    "This action will suspend your account immediately",
    "You will be logged out and won't be able to access your account for 24 hours. After 24 hours, you can reactivate by logging back in.",
    "I understand and want to suspend my account",
    "Cancel",
    "Suspending...",
    "Account Suspended",
    "Your account has been suspended. You can reactivate it after 24 hours by logging in.",
    "Error",
    "Failed to suspend account. Please try again."
  ], []);

  const { translations } = useMasterBatchTranslation(suspendTexts, 'high');
  
  // Create translation mapping
  const ts: Record<string, string> = {};
  suspendTexts.forEach((text, index) => {
    ts[text] = translations[index] || text;
  });

  const suspendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/suspend-account");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || ts["Failed to suspend account. Please try again."] || "Failed to suspend account");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: ts["Account Suspended"] || "Account Suspended",
        description: ts["Your account has been suspended. You can reactivate it after 24 hours by logging in."] || "Your account has been suspended. You can reactivate it after 24 hours by logging in.",
      });
      setTimeout(() => {
        logoutMutation.mutate();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: ts["Error"] || "Error",
        description: error.message || ts["Failed to suspend account. Please try again."] || "Failed to suspend account. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title={ts["Suspend Account"] || "Suspend Account"} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => navigate("/settings")}
          variant="ghost"
          className="mb-6"
          data-testid="button-back-settings"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {ts["Back to Settings"] || "Back to Settings"}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{ts["Account Suspension"] || "Account Suspension"}</CardTitle>
            <CardDescription>
              {ts["Temporarily suspending your account will deactivate it. You can easily reactivate your account after 24 hours by logging back in."] || "Temporarily suspending your account will deactivate it. You can easily reactivate your account after 24 hours by logging back in."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{ts["Impact on Your Profile and Previous Activity on Dedw3n"] || "Impact on Your Profile and Previous Activity on Dedw3n"}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>{ts["Your profile will be hidden from everyone, including your connections."] || "Your profile will be hidden from everyone, including your connections."}</li>
                <li>{ts["Your previous activity will remain visible, but your profile photo and name will be removed."] || "Your previous activity will remain visible, but your profile photo and name will be removed."}</li>
                <li>{ts["Other users won't be able to find or message you."] || "Other users won't be able to find or message you."}</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{ts["Effects on Your Subscriptions and Licenses"] || "Effects on Your Subscriptions and Licenses"}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>{ts["Subscription:"] || "Subscription:"}</strong> {ts["Any active subscriptions will be automatically canceled when your account is suspended. If you decide to reactivate, you might lose access to discounted pricing. Additionally, if you purchased your Premium subscription through Apple, it will also be canceled with the suspension. To prevent any future billing, you'll need to cancel the subscription directly with your financial institution."] || "Any active subscriptions will be automatically canceled when your account is suspended. If you decide to reactivate, you might lose access to discounted pricing. Additionally, if you purchased your Premium subscription through Apple, it will also be canceled with the suspension. To prevent any future billing, you'll need to cancel the subscription directly with your financial institution."}
                </p>
              </div>
            </div>

            <Separator />

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">
                  {ts["This action will suspend your account immediately"] || "This action will suspend your account immediately"}
                </p>
                <p className="text-sm text-black">
                  {ts["You will be logged out and won't be able to access your account for 24 hours. After 24 hours, you can reactivate by logging back in."] || "You will be logged out and won't be able to access your account for 24 hours. After 24 hours, you can reactivate by logging back in."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirm-suspend"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                data-testid="checkbox-confirm-suspend"
              />
              <label htmlFor="confirm-suspend" className="text-sm text-gray-700 cursor-pointer">
                {ts["I understand and want to suspend my account"] || "I understand and want to suspend my account"}
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                data-testid="button-cancel-suspend"
              >
                {ts["Cancel"] || "Cancel"}
              </Button>
              <Button
                onClick={() => suspendMutation.mutate()}
                disabled={!isConfirmed || suspendMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
                data-testid="button-confirm-suspend"
              >
                {suspendMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {ts["Suspending..."] || "Suspending..."}
                  </>
                ) : (
                  ts["Suspend Account"] || "Suspend Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
