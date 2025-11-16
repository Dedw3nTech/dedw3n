import { useState } from 'react';

export type ConsentStatus = 'granted';

interface UseLocationConsentReturn {
  consentStatus: ConsentStatus;
}

export function useLocationConsent(): UseLocationConsentReturn {
  const [consentStatus] = useState<ConsentStatus>('granted');

  return { consentStatus };
}
