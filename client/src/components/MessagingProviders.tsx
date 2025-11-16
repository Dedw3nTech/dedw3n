import { ReactNode } from "react";
import { MessagingProvider } from "@/hooks/use-messaging";

interface MessagingProvidersProps {
  children: ReactNode;
}

export function MessagingProviders({ children }: MessagingProvidersProps) {
  return (
    <MessagingProvider>
      {children}
    </MessagingProvider>
  );
}
