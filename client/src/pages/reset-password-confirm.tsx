import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import { PasswordStrengthValidator } from "@/components/PasswordStrengthValidator";

export default function ResetPasswordConfirm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
  const passwordStrength = usePasswordStrength(password);

  // Extract token from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      // Redirect to forgot password page if no token
      setLocation("/reset-password");
    }
  }, [setLocation]);

  const resetMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, password });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: translateText("Password reset successful"),
        description: translateText("Your password has been reset successfully"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: translateText("Error"),
        description: error.message || translateText("Failed to reset password"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: translateText("Error"),
        description: translateText("Please enter a new password"),
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength?.result?.isWeak) {
      toast({
        title: translateText("Error"),
        description: translateText("Password is too weak. Please choose a stronger password"),
        variant: "destructive",
      });
      return;
    }

    resetMutation.mutate({ token, password });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">
                {translateText("Password reset complete")}
              </CardTitle>
              <CardDescription>
                {translateText("Your password has been reset successfully. You can now sign in with your new password.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Link href="/auth">
                  <Button className="w-full">
                    {translateText("Sign in now")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">
                {translateText("Invalid reset link")}
              </CardTitle>
              <CardDescription>
                {translateText("This password reset link is invalid or has expired.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Link href="/reset-password">
                  <Button className="w-full">
                    {translateText("Request new reset link")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center text-black">
              {translateText("Set new password")}
            </CardTitle>
            <CardDescription className="text-center">
              {translateText("Enter your new password below")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{translateText("New password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={translateText("Enter new password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 h-12"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {password && (
                  <PasswordStrengthValidator 
                    password={password}
                    onPasswordChange={setPassword}
                  />
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={
                  resetMutation.isPending || 
                  !password.trim() ||
                  (passwordStrength?.result?.isWeak === true)
                }
                data-testid="button-reset-password"
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translateText("Resetting password")}
                  </>
                ) : (
                  translateText("Reset password")
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth" className="text-sm text-black hover:text-gray-700">
                {translateText("Back to sign in")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}