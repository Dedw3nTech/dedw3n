import { useState, useCallback } from 'react';

interface AffiliatePartner {
  id: number;
  name: string;
  email: string;
  company?: string;
  partnerCode: string;
  status: string;
  isVerified: boolean;
  commissionRate: string;
}

interface VerificationResponse {
  success: boolean;
  partner?: AffiliatePartner;
  message: string;
}

interface AffiliateVerificationState {
  isVerifying: boolean;
  isValid: boolean | null;
  partner: AffiliatePartner | null;
  error: string | null;
  message: string | null;
}

export function useAffiliateVerification() {
  const [state, setState] = useState<AffiliateVerificationState>({
    isVerifying: false,
    isValid: null,
    partner: null,
    error: null,
    message: null,
  });

  const verifyPartnerCode = useCallback(async (partnerCode: string): Promise<boolean> => {
    if (!partnerCode.trim()) {
      setState({
        isVerifying: false,
        isValid: null,
        partner: null,
        error: null,
        message: null,
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      isVerifying: true,
      error: null,
      message: null,
    }));

    try {
      const response = await fetch('/api/affiliate-partners/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partnerCode: partnerCode.trim() }),
      });

      const data: VerificationResponse = await response.json();

      if (data.success && data.partner) {
        setState({
          isVerifying: false,
          isValid: true,
          partner: data.partner,
          error: null,
          message: data.message,
        });
        return true;
      } else {
        setState({
          isVerifying: false,
          isValid: false,
          partner: null,
          error: data.message,
          message: null,
        });
        return false;
      }
    } catch (error) {
      console.error('Error verifying affiliate partner code:', error);
      setState({
        isVerifying: false,
        isValid: false,
        partner: null,
        error: 'Network error occurred while verifying partner code',
        message: null,
      });
      return false;
    }
  }, []);

  const clearVerification = useCallback(() => {
    setState({
      isVerifying: false,
      isValid: null,
      partner: null,
      error: null,
      message: null,
    });
  }, []);

  return {
    ...state,
    verifyPartnerCode,
    clearVerification,
  };
}