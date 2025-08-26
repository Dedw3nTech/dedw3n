import { useEffect, useState } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Monitor } from 'lucide-react';

export function MobileRedirectHandler() {
  // Mobile redirect handler disabled - no longer shows countdown modal or auto-redirects
  // Mobile detection functionality preserved for responsive design purposes only
  const { isMobile } = useMobileDetection();

  // Log mobile detection for debugging purposes only (no redirect behavior)
  console.log('[MOBILE-DETECTION] Device detected as mobile:', isMobile, '(redirect disabled)');

  // Return null - no modal or redirect behavior
  return null;
}