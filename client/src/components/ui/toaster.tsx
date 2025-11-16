import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "wouter"
import { ReportButton } from "@/components/ui/report-button"
import { useMasterTranslation } from "@/hooks/use-master-translation"
import toastLogo from "@assets/transparent logo_1763006565341.png"

export function Toaster() {
  const { toasts } = useToast()
  const [, setLocation] = useLocation()
  const { translateText } = useMasterTranslation()
  const isProduction = import.meta.env.PROD

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, errorType, errorMessage, ...props }) {
        // Custom error toast with white background and contact info
        if (variant === "destructive") {
          const showContactInfo = title !== "Login Required";
          const hasErrorDetails = errorType && errorMessage;
          
          return (
            <Toast 
              key={id} 
              {...props}
              className="bg-white border border-gray-200 shadow-lg"
            >
              <div className="flex items-start gap-3 w-full">
                <img 
                  src={toastLogo} 
                  alt="Dedw3n Logo" 
                  className="w-24 h-24 object-contain flex-shrink-0 mt-1"
                />
                <div className="flex-1 grid gap-2">
                  {title && (
                    <ToastTitle className="text-black font-semibold">
                      {typeof title === 'string' ? translateText(title, 'instant') : title}
                    </ToastTitle>
                  )}
                  {description && (
                    <ToastDescription className="text-black">
                      {typeof description === 'string' ? translateText(description, 'instant') : description}
                    </ToastDescription>
                  )}
                  {showContactInfo && !hasErrorDetails && (
                    <div className="text-sm text-black">
                      {translateText("Please refresh the page. If the error persists", 'instant')},{" "}
                      <button
                        onClick={() => setLocation("/contact")}
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        {translateText("kindly contact us", 'instant')}
                      </button>
                      {" "}{translateText("for assistance", 'instant')}.
                    </div>
                  )}
                  {hasErrorDetails && (
                    <div className="mt-2">
                      <ReportButton
                        errorType={errorType}
                        errorMessage={errorMessage}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  )}
                  {isProduction && !hasErrorDetails && (
                    <div className="mt-2">
                      <ReportButton
                        toastTitle={typeof title === 'string' ? title : String(title || '')}
                        toastDescription={typeof description === 'string' ? description : String(description || '')}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              <ToastClose className="text-black hover:text-gray-600" />
            </Toast>
          )
        }

        // Default toast for non-error messages
        return (
          <Toast key={id} {...props}>
            <div className="flex items-start gap-3 w-full">
              <img 
                src={toastLogo} 
                alt="Dedw3n Logo" 
                className="w-[72px] h-[72px] object-contain flex-shrink-0 mt-1"
              />
              <div className="flex-1 grid gap-1">
                {title && <ToastTitle>{typeof title === 'string' ? translateText(title, 'instant') : title}</ToastTitle>}
                {description && (
                  <ToastDescription>{typeof description === 'string' ? translateText(description, 'instant') : description}</ToastDescription>
                )}
                {isProduction && (
                  <div className="mt-2">
                    <ReportButton
                      toastTitle={typeof title === 'string' ? title : String(title || '')}
                      toastDescription={typeof description === 'string' ? description : String(description || '')}
                      variant="outline"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
