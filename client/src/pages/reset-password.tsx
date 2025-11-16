import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useMasterTranslation } from "@/hooks/use-master-translation";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();

  const resetMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send reset email");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: translateText("Error"), 
        description: error.message || translateText("Failed to send reset email"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: translateText("Error"),
        description: translateText("Please enter your email address"),
        variant: "destructive",
      });
      return;
    }
    resetMutation.mutate(email.trim());
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-6 px-4">
        <div className="max-w-xl w-full">
          <Card className="bg-white text-black border-0 shadow-none">
            <CardHeader className="text-center space-y-2 pb-4">
              <CardTitle className="text-2xl text-black">
                {translateText("Check your email")}
              </CardTitle>
              <CardDescription className="text-black">
                {translateText("We've sent password reset instructions to")} <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="text-sm text-black text-center">
                <p>{translateText("Didn't receive the email? Check your spam folder or")}</p>
                <button
                  type="button"
                  className="text-black hover:text-gray-700 font-medium"
                  onClick={() => {
                    setIsSubmitted(false);
                    resetMutation.reset();
                  }}
                  data-testid="button-try-again"
                >
                  {translateText("try again")}
                </button>
              </div>
              <div className="text-center">
                <Link href="/auth" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500" data-testid="link-back-auth-success">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {translateText("Back to sign in")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-6 px-4">
      <div className="max-w-xl w-full">
        <Card className="bg-white text-black border-0 shadow-none">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl text-center text-black">
              {translateText("Reset your password")}
            </CardTitle>
            <CardDescription className="text-center text-xs text-black">
              {translateText("Enter your email address and we'll send you a link to reset your password")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-black">{translateText("Enter your email address below")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={translateText("Email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white text-black placeholder:text-black h-12"
                  data-testid="input-email"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={resetMutation.isPending || !email.trim()}
                data-testid="button-send-reset"
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translateText("Sending")}
                  </>
                ) : (
                  translateText("Send reset link")
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/auth" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500" data-testid="link-back-auth">
                <ArrowLeft className="mr-1 h-4 w-4" />
                {translateText("Back to sign in")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}