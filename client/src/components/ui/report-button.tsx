import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, Bug } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface ReportButtonProps {
  errorType: string;
  errorMessage: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
}

export function ReportButton({ 
  errorType, 
  errorMessage, 
  className = "",
  variant = "outline",
  size = "sm",
  showIcon = true
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const reportData = {
        errorType,
        errorMessage,
        url: window.location.href,
        userAgent: navigator.userAgent,
        additionalInfo: additionalInfo.trim() || undefined,
        userEmail: !user && userEmail.trim() ? userEmail.trim() : undefined
      };
      
      const response = await apiRequest({
        url: '/api/report-error',
        method: 'POST',
        body: reportData
      });
      
      if (response.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          setIsOpen(false);
          setSubmitStatus('idle');
          setAdditionalInfo('');
          setUserEmail('');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setSubmitStatus('idle');
    setAdditionalInfo('');
    setUserEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`${className}`}
        >
          {showIcon && <Bug className="h-4 w-4 mr-2" />}
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report Technical Issue
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting this error. Your report will be sent to our technical team for investigation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Error Information */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-medium text-sm mb-2">Error Details:</h4>
            <p className="text-sm text-gray-600 mb-1"><strong>Type:</strong> {errorType}</p>
            <p className="text-sm text-gray-600"><strong>Message:</strong> {errorMessage}</p>
          </div>
          
          {/* User Email (only if not logged in) */}
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="user-email">Email (optional)</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="your.email@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Provide your email if you'd like us to follow up with you about this issue.
              </p>
            </div>
          )}
          
          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="additional-info">Additional Information (optional)</Label>
            <Textarea
              id="additional-info"
              placeholder="Describe what you were doing when this error occurred, or provide any additional context..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          
          {/* Status Messages */}
          {submitStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Error report sent successfully! Thank you for helping us improve.
              </AlertDescription>
            </Alert>
          )}
          
          {submitStatus === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to send error report. Please try again or contact support directly.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || submitStatus === 'success'}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Sending...' : 'Send Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}