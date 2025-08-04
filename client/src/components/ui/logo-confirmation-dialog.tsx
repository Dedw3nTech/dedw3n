import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

interface LogoConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  showLogo?: boolean;
}

export function LogoConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showLogo = true
}: LogoConfirmationDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'info':
        return <Info className="h-8 w-8 text-blue-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          {showLogo && (
            <div className="flex justify-center mb-4">
              <img 
                src="/dedw3n-main-logo.png" 
                alt="Dedw3n" 
                className="h-12 w-auto"
                onError={(e) => {
                  // Fallback if logo doesn't load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex justify-center mb-3">
            {getIcon()}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 ${getButtonStyle()}`}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}