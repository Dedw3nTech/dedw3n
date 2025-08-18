import { Router } from 'express';
import { z } from 'zod';
import { clearoutValidation, ValidationConfig, MultiFieldValidationRequest } from '../services/clearout-validation';

const router = Router();

// Request validation schemas
const emailValidationSchema = z.object({
  email: z.string().email('Invalid email format'),
  config: z.object({
    block_disposable: z.boolean().optional(),
    block_role: z.boolean().optional(),
    block_free: z.boolean().optional(),
    require_mx: z.boolean().optional()
  }).optional()
});

const phoneValidationSchema = z.object({
  phone: z.string().min(10, 'Phone number too short'),
  country: z.string().optional(),
  config: z.object({
    accept_mobile_only: z.boolean().optional(),
    accept_landline_only: z.boolean().optional(),
    block_voip: z.boolean().optional(),
    block_tollfree: z.boolean().optional()
  }).optional()
});

const nameValidationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  config: z.object({
    block_gibberish: z.boolean().optional(),
    min_length: z.number().optional(),
    max_length: z.number().optional()
  }).optional()
});

const multiFieldValidationSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  name: z.string().min(1).optional(),
  config: z.object({
    email: z.object({
      block_disposable: z.boolean().optional(),
      block_role: z.boolean().optional(),
      block_free: z.boolean().optional(),
      require_mx: z.boolean().optional()
    }).optional(),
    phone: z.object({
      accept_mobile_only: z.boolean().optional(),
      accept_landline_only: z.boolean().optional(),
      block_voip: z.boolean().optional(),
      block_tollfree: z.boolean().optional()
    }).optional(),
    name: z.object({
      block_gibberish: z.boolean().optional(),
      min_length: z.number().optional(),
      max_length: z.number().optional()
    }).optional()
  }).optional()
});

/**
 * POST /api/validation/email
 * Validate email address in real-time
 */
router.post('/email', async (req, res) => {
  try {
    console.log('[VALIDATION] Email validation request received');
    
    const validatedData = emailValidationSchema.parse(req.body);
    const result = await clearoutValidation.validateEmail(
      validatedData.email, 
      validatedData.config
    );

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[VALIDATION] Email validation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Email validation failed',
      message: (error as Error).message
    });
  }
});

/**
 * POST /api/validation/phone
 * Validate phone number in real-time
 */
router.post('/phone', async (req, res) => {
  try {
    console.log('[VALIDATION] Phone validation request received');
    
    const validatedData = phoneValidationSchema.parse(req.body);
    const result = await clearoutValidation.validatePhone(
      validatedData.phone,
      validatedData.country,
      validatedData.config
    );

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[VALIDATION] Phone validation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Phone validation failed',
      message: (error as Error).message
    });
  }
});

/**
 * POST /api/validation/name
 * Validate name field
 */
router.post('/name', async (req, res) => {
  try {
    console.log('[VALIDATION] Name validation request received');
    
    const validatedData = nameValidationSchema.parse(req.body);
    const result = await clearoutValidation.validateName(
      validatedData.name,
      validatedData.config
    );

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[VALIDATION] Name validation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Name validation failed',
      message: (error as Error).message
    });
  }
});

/**
 * POST /api/validation/multi-field
 * Validate multiple fields simultaneously
 */
router.post('/multi-field', async (req, res) => {
  try {
    console.log('[VALIDATION] Multi-field validation request received');
    
    const validatedData = multiFieldValidationSchema.parse(req.body);
    
    // Ensure at least one field is provided
    if (!validatedData.email && !validatedData.phone && !validatedData.name) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (email, phone, or name) must be provided'
      });
    }

    const result = await clearoutValidation.validateMultipleFields(validatedData as MultiFieldValidationRequest);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[VALIDATION] Multi-field validation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Multi-field validation failed',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/validation/health
 * Health check for validation service
 */
router.get('/health', async (req, res) => {
  try {
    // Test with a simple email validation
    const testResult = await clearoutValidation.validateEmail('test@example.com');
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'Clearout Validation API',
      timestamp: new Date().toISOString(),
      test_result: {
        processed: true,
        confidence: testResult.confidence
      }
    });

  } catch (error) {
    console.error('[VALIDATION] Health check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'Clearout Validation API',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;