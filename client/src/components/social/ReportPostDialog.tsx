import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Flag } from "lucide-react";
import { useMasterTranslation } from "@/hooks/use-master-translation";

interface ReportPostDialogProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "violence", label: "Violence or dangerous content" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "misinformation", label: "False information" },
  { value: "intellectual_property", label: "Intellectual property violation" },
  { value: "other", label: "Other" },
];

export default function ReportPostDialog({
  postId,
  isOpen,
  onClose,
}: ReportPostDialogProps) {
  const { toast } = useToast();
  const { translateText } = useMasterTranslation();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const reportPostTitle = translateText("Report Post");
  const reportPostDescription = translateText("Help us understand what's wrong with this post. Your report will be reviewed by our moderation team.");
  const whyReportingLabel = translateText("Why are you reporting this post? *");
  const additionalDetailsLabel = translateText("Additional details (optional)");
  const additionalDetailsPlaceholder = translateText("Provide any additional information that might help us understand the issue...");
  const cancelText = translateText("Cancel");
  const submitReportText = translateText("Submit Report");
  const submittingText = translateText("Submitting...");
  
  const reportSubmittedTitle = translateText("Report submitted");
  const reportSubmittedDescription = translateText("Thank you for helping keep our community safe. We'll review this content shortly.");
  const errorTitle = translateText("Error");
  const reportErrorDescription = translateText("Failed to submit report. Please try again.");
  const reasonRequiredTitle = translateText("Reason required");
  const reasonRequiredDescription = translateText("Please select a reason for reporting this post");
  
  const translatedReasons = REPORT_REASONS.map(reason => ({
    ...reason,
    label: translateText(reason.label)
  }));

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReason) {
        throw new Error("Please select a reason for reporting");
      }

      const response = await apiRequest("POST", "/api/reports/post", {
        postId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit report");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: reportSubmittedTitle,
        description: reportSubmittedDescription,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: errorTitle,
        description: error.message || reportErrorDescription,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedReason("");
    setDescription("");
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      toast({
        title: reasonRequiredTitle,
        description: reasonRequiredDescription,
        variant: "destructive",
      });
      return;
    }
    reportMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-report-post">
        <DialogHeader>
          <DialogTitle>
            {reportPostTitle}
          </DialogTitle>
          <DialogDescription>
            {reportPostDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {whyReportingLabel}
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              data-testid="radio-report-reason"
            >
              {translatedReasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={reason.value}
                    id={reason.value}
                    data-testid={`radio-${reason.value}`}
                    className="border-black text-black"
                  />
                  <Label
                    htmlFor={reason.value}
                    className="font-normal cursor-pointer"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              {additionalDetailsLabel}
            </Label>
            <Textarea
              id="description"
              placeholder={additionalDetailsPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
              data-testid="textarea-report-description"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={reportMutation.isPending}
            data-testid="button-cancel-report"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reportMutation.isPending || !selectedReason}
            className="bg-black hover:bg-gray-800 text-white"
            data-testid="button-submit-report"
          >
            {reportMutation.isPending ? submittingText : submitReportText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
