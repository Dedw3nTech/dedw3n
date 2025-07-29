import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useMasterTranslation } from "@/hooks/use-master-translation";

interface DeleteStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vendorType: 'private' | 'business';
  isDeleting: boolean;
}

export function DeleteStoreModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  vendorType, 
  isDeleting 
}: DeleteStoreModalProps) {
  // Define translatable texts for the modal
  const modalTexts = [
    "Delete Store Confirmation",
    "Are you sure you want to permanently delete your",
    "vendor store?",
    "This action cannot be undone. All your products and data will be permanently removed.",
    "private",
    "business", 
    "Cancel",
    "Delete Store",
    "Deleting..."
  ];

  const { translatedTexts } = useMasterTranslation(modalTexts, 'delete-store-modal');
  const finalTexts = translatedTexts || modalTexts;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center space-y-4">
          {/* Dedw3n Logo */}
          <div className="flex justify-center mb-2">
            <img 
              src="/attached_assets/D3 black logo.png" 
              alt="Dedw3n" 
              className="h-12 w-auto"
            />
          </div>
          
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {finalTexts[0]}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Warning Icon */}
          <div className="flex items-center justify-center">
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          {/* Warning Message */}
          <div className="text-center space-y-2">
            <p className="text-gray-700 font-medium">
              {finalTexts[1]} {finalTexts[vendorType === 'private' ? 4 : 5]} {finalTexts[2]}
            </p>
            <p className="text-sm text-gray-600">
              {finalTexts[3]}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isDeleting}
            >
              {finalTexts[6]}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? finalTexts[8] : finalTexts[7]}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}