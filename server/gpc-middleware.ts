import { Request, Response } from 'express';

export interface GPCSignal {
  detected: boolean;
  value: boolean | undefined;
  source: 'header' | 'none';
  timestamp: Date;
}

/**
 * Utility function to extract Global Privacy Control (GPC) signal from request headers
 * Spec: https://globalprivacycontrol.org/
 * 
 * Usage: Call this in controllers that need GPC information, then apply headers as needed
 */
export function extractGpcSignal(req: Request): GPCSignal {
  const timestamp = new Date();
  
  // Check for Sec-GPC header (standard GPC header)
  const secGpcHeader = req.headers['sec-gpc'];
  
  if (secGpcHeader !== undefined) {
    const gpcValue = secGpcHeader === '1' || secGpcHeader === 'true';
    
    console.log(`[GPC] Detected GPC header: ${secGpcHeader} (parsed as: ${gpcValue})`);
    
    return {
      detected: true,
      value: gpcValue,
      source: 'header',
      timestamp
    };
  }
  
  return {
    detected: false,
    value: undefined,
    source: 'none',
    timestamp
  };
}

/**
 * Utility function to apply GPC preferences to response headers
 * Call this after extractGpcSignal() if GPC signal is detected
 */
export function applyGpcHeaders(res: Response, gpcSignal: GPCSignal): void {
  if (gpcSignal.detected && gpcSignal.value === true) {
    // User has opted out via GPC
    res.setHeader('GPC-Status', 'respected');
    res.setHeader('GPC-Applied', 'true');
    res.setHeader('Data-Processing', 'minimal');
    res.setHeader('Third-Party-Sharing', 'disabled');
    
    // Add to response locals for template usage
    res.locals.gpcOptOut = true;
    res.locals.gpcApplied = true;
  } else {
    if (gpcSignal.detected) {
      res.setHeader('GPC-Status', 'noted');
    }
    res.locals.gpcOptOut = false;
    res.locals.gpcApplied = false;
  }
}