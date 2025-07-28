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
const dedwenLogo = "/attached_assets/Dedw3n Logo_1749080607700.png"
const newDedwenLogo = "/attached_assets/Dedw3n Logo_1749096101995.png"

export function Toaster() {
  const { toasts } = useToast()
  const [, setLocation] = useLocation()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Custom error toast with white background and contact info
        if (variant === "destructive") {
          return (
            <Toast 
              key={id} 
              {...props}
              className="bg-white border border-gray-200 shadow-lg"
            >
              <div className="flex items-start gap-3 w-full">
                <img 
                  src={newDedwenLogo} 
                  alt="Dedw3n Logo" 
                  className="w-8 h-8 flex-shrink-0 mt-1"
                />
                <div className="flex-1 grid gap-2">
                  {title && (
                    <ToastTitle className="text-black font-semibold">
                      {title}
                    </ToastTitle>
                  )}
                  {description && (
                    <ToastDescription className="text-black">
                      {description}
                    </ToastDescription>
                  )}
                  <div className="text-sm text-black">
                    Please refresh the page. If the error persists,{" "}
                    <button
                      onClick={() => setLocation("/contact")}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      kindly contact us
                    </button>
                    {" "}for assistance.
                  </div>
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
                src={newDedwenLogo} 
                alt="Dedw3n Logo" 
                className="w-6 h-6 flex-shrink-0 mt-1"
              />
              <div className="flex-1 grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
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