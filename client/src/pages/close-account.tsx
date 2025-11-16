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

export default function CloseAccountPage() {
  usePageTitle({ title: "Close Account" });
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Translation strings for the close account page
  const closeTexts = useMemo(() => [
    "Close Account",
    "Back to Settings",
    "Account Closure",
    ", we're sad to see you leave.",
    "Are you sure you want to close your account? Please be aware that this will result in losing your connections, messages, endorsements, and recommendations.",
    "This action is permanent and cannot be undone",
    "Once you close your account, all your data will be permanently deleted and you will not be able to recover it.",
    "I understand this action is permanent and want to close my account",
    "Cancel",
    "Closing Account...",
    "Close Account Permanently",
    "Account Closed",
    "Your account has been permanently deleted.",
    "Error",
    "Failed to close account. Please try again."
  ], []);

  const { translations } = useMasterBatchTranslation(closeTexts, 'high');
  
  // Create translation mapping
  const ts: Record<string, string> = {};
  closeTexts.forEach((text, index) => {
    ts[text] = translations[index] || text;
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/user/close-account");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || ts["Failed to close account. Please try again."] || "Failed to close account");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: ts["Account Closed"] || "Account Closed",
        description: ts["Your account has been permanently deleted."] || "Your account has been permanently deleted.",
      });
      setTimeout(() => {
        logoutMutation.mutate();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: ts["Error"] || "Error",
        description: error.message || ts["Failed to close account. Please try again."] || "Failed to close account. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title={ts["Close Account"] || "Close Account"} />
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
            <CardTitle className="text-2xl">{ts["Account Closure"] || "Account Closure"}</CardTitle>
            <CardDescription>
              {user.name || user.username}{ts[", we're sad to see you leave."] || ", we're sad to see you leave."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {ts["Are you sure you want to close your account? Please be aware that this will result in losing your connections, messages, endorsements, and recommendations."] || "Are you sure you want to close your account? Please be aware that this will result in losing your connections, messages, endorsements, and recommendations."}
            </p>

            <Separator />

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">
                  {ts["This action is permanent and cannot be undone"] || "This action is permanent and cannot be undone"}
                </p>
                <p className="text-sm text-black">
                  {ts["Once you close your account, all your data will be permanently deleted and you will not be able to recover it."] || "Once you close your account, all your data will be permanently deleted and you will not be able to recover it."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirm-delete"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                data-testid="checkbox-confirm-delete"
              />
              <label htmlFor="confirm-delete" className="text-sm text-gray-700 cursor-pointer">
                {ts["I understand this action is permanent and want to close my account"] || "I understand this action is permanent and want to close my account"}
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                data-testid="button-cancel-delete"
              >
                {ts["Cancel"] || "Cancel"}
              </Button>
              <Button
                onClick={() => deleteAccountMutation.mutate()}
                disabled={!isConfirmed || deleteAccountMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
                data-testid="button-confirm-delete"
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {ts["Closing Account..."] || "Closing Account..."}
                  </>
                ) : (
                  ts["Close Account Permanently"] || "Close Account Permanently"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
