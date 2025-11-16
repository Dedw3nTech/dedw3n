import { ReactNode } from "react";
import { ViewProvider } from "@/hooks/use-view";
import { SubscriptionProvider } from "@/hooks/use-subscription";

interface SocialProvidersProps {
  children: ReactNode;
}

export function SocialProviders({ children }: SocialProvidersProps) {
  return (
    <ViewProvider>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </ViewProvider>
  );
}
