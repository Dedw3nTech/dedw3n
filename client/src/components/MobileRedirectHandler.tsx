import { useEffect, useState } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Monitor } from 'lucide-react';

export function MobileRedirectHandler() {
  // Instant mobile redirect handler - no modals, no countdown, immediate redirect
  const { shouldRedirect, isMobile, isRedirecting } = useMobileDetection();

  // Log mobile detection for debugging
  console.log('[MOBILE-DETECTION] Device detected as mobile:', isMobile, 'shouldRedirect:', shouldRedirect, 'isRedirecting:', isRedirecting);

  // No UI needed - redirect happens instantly in the hook
  // Return null as redirect is handled automatically
  return null;
}