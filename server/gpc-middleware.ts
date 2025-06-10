import { Request, Response, NextFunction } from 'express';

export interface GPCRequest extends Request {
  gpc?: {
    detected: boolean;
    value: boolean | undefined;
    source: 'header' | 'none';
    timestamp: Date;
  };
}

/**
 * Middleware to detect Global Privacy Control (GPC) signals from HTTP headers
 * Spec: https://globalprivacycontrol.org/
 */
export function gpcMiddleware(req: GPCRequest, res: Response, next: NextFunction) {
  const timestamp = new Date();
  
  // Check for Sec-GPC header (standard GPC header)
  const secGpcHeader = req.headers['sec-gpc'];
  
  if (secGpcHeader !== undefined) {
    const gpcValue = secGpcHeader === '1' || secGpcHeader === 'true';
    
    req.gpc = {
      detected: true,
      value: gpcValue,
      source: 'header',
      timestamp
    };
    
    console.log(`[GPC] Detected GPC header: ${secGpcHeader} (parsed as: ${gpcValue})`);
    
    // Set response header to acknowledge GPC signal
    res.setHeader('GPC-Status', gpcValue ? 'respected' : 'noted');
    
  } else {
    req.gpc = {
      detected: false,
      value: undefined,
      source: 'none',
      timestamp
    };
  }
  
  next();
}

/**
 * Apply GPC preferences to response headers and processing
 */
export function applyGPCHeaders(req: GPCRequest, res: Response, next: NextFunction) {
  if (req.gpc?.detected && req.gpc.value === true) {
    // User has opted out via GPC
    res.setHeader('GPC-Applied', 'true');
    res.setHeader('Data-Processing', 'minimal');
    res.setHeader('Third-Party-Sharing', 'disabled');
    
    // Add to response locals for template usage
    res.locals.gpcOptOut = true;
    res.locals.gpcApplied = true;
  } else {
    res.locals.gpcOptOut = false;
    res.locals.gpcApplied = false;
  }
  
  next();
}