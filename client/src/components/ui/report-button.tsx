import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMasterTranslation } from "@/hooks/use-master-translation";

interface ReportButtonProps {
  errorType?: string;
  errorMessage?: string;
  toastTitle?: string;
  toastDescription?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "default" | "lg";
}

export function ReportButton({ 
  errorType, 
  errorMessage, 
  toastTitle,
  toastDescription,
  className = "",
  variant = "outline",
  size = "sm"
}: ReportButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();

  const handleInstantReport = async () => {
    if (isSubmitting || isSuccess) return;
    
    setIsSubmitting(true);
    
    try {
      const reportData = {
        errorType: errorType || 'Toast Notification Report',
        errorMessage: errorMessage || `Title: ${toastTitle || 'N/A'}, Description: ${toastDescription || 'N/A'}`,
        toastTitle,
        toastDescription,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      
      const response = await apiRequest('POST', '/api/report-error', reportData);
      
      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
        toast({
          title: translateText("Error Reported", 'instant'),
          description: translateText("Thank you! The error has been sent to our technical team.", 'instant'),
          variant: "default",
        });
        
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      } else {
        toast({
          title: translateText("Report Failed", 'instant'),
          description: translateText("Unable to send error report. Please try again.", 'instant'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: translateText("Report Failed", 'instant'),
        description: translateText("Unable to send error report. Please try again.", 'instant'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleInstantReport}
      disabled={isSubmitting || isSuccess}
      data-testid="button-report-error"
    >
      {isSubmitting ? translateText('Sending...', 'instant') : isSuccess ? translateText('Sent!', 'instant') : translateText('Report', 'instant')}
    </Button>
  );
}
