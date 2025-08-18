import fetch from 'node-fetch';

// Clearout API response interfaces
export interface EmailValidationResponse {
  status: 'success' | 'error';
  data?: {
    email_address: string;
    safe_to_send: 'yes' | 'no';
    status: 'valid' | 'invalid' | 'unknown';
    verified_on: string;
    time_taken: number;
    sub_status: {
      code: number;
      desc: string;
    };
    detail_info: {
      account: string;
      domain: string;
      mx_record: string;
      smtp_provider: string;
    };
    disposable: 'yes' | 'no';
    free: 'yes' | 'no';
    role: 'yes' | 'no';
    gibberish: 'yes' | 'no';
  };
  error_code?: number;
  error_message?: string;
}

export interface PhoneValidationResponse {
  status: 'success' | 'error';
  data?: {
    phone_number: string;
    is_valid: boolean;
    line_type: 'mobile' | 'landline' | 'voip' | 'unknown';
    carrier: string;
    location: {
      country: string;
      region: string;
      timezone: string;
    };
    formatted_number: string;
  };
  error_code?: number;
  error_message?: string;
}

export interface ValidationConfig {
  email?: {
    block_disposable?: boolean;
    block_role?: boolean;
    block_free?: boolean;
    require_mx?: boolean;
  };
  phone?: {
    accept_mobile_only?: boolean;
    accept_landline_only?: boolean;
    block_voip?: boolean;
    block_tollfree?: boolean;
  };
  name?: {
    block_gibberish?: boolean;
    min_length?: number;
    max_length?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  confidence: number;
  details?: any;
  suggestions?: string[];
}

export interface MultiFieldValidationRequest {
  email?: string;
  phone?: string;
  name?: string;
  config?: ValidationConfig;
}

export interface MultiFieldValidationResult {
  email?: ValidationResult;
  phone?: ValidationResult;
  name?: ValidationResult;
  overall_score: number;
  processing_time: number;
}

export class ClearoutValidationService {
  private apiKey: string;
  private emailApiUrl = 'https://api.clearout.io/v2/';
  private phoneApiUrl = 'https://api.clearoutphone.io/v1/';

  constructor() {
    this.apiKey = process.env.CLEAROUT_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('CLEAROUT_API_KEY environment variable is required');
    }
  }

  /**
   * Validate email address using Clearout API
   */
  async validateEmail(email: string, config?: ValidationConfig['email']): Promise<ValidationResult> {
    try {
      console.log(`[CLEAROUT] Validating email: ${email}`);
      
      const startTime = Date.now();
      const response = await fetch(`${this.emailApiUrl}email_verify/instant`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data: EmailValidationResponse = await response.json() as EmailValidationResponse;
      const processingTime = Date.now() - startTime;

      if (data.status === 'error') {
        console.error('[CLEAROUT] Email validation error:', data.error_message);
        return {
          isValid: false,
          message: data.error_message || 'Email validation failed',
          confidence: 0,
          details: { error_code: data.error_code }
        };
      }

      if (!data.data) {
        return {
          isValid: false,
          message: 'Invalid response from validation service',
          confidence: 0
        };
      }

      const emailData = data.data;
      
      // Apply configuration rules
      const configViolations: string[] = [];
      
      if (config?.block_disposable && emailData.disposable === 'yes') {
        configViolations.push('Disposable email addresses are not allowed');
      }
      
      if (config?.block_role && emailData.role === 'yes') {
        configViolations.push('Role-based email addresses are not allowed');
      }
      
      if (config?.block_free && emailData.free === 'yes') {
        configViolations.push('Free email providers are not allowed');
      }
      
      if (config?.require_mx && !emailData.detail_info.mx_record) {
        configViolations.push('Email domain must have MX record');
      }

      // Determine overall validation result
      const isBasicValid = emailData.status === 'valid' && emailData.safe_to_send === 'yes';
      const hasConfigViolations = configViolations.length > 0;
      
      const isValid = isBasicValid && !hasConfigViolations;
      
      // Generate user-friendly message
      let message = '';
      if (!isBasicValid) {
        if (emailData.status === 'invalid') {
          message = 'Email address is invalid or does not exist';
        } else if (emailData.safe_to_send === 'no') {
          message = 'Email address is not safe for sending';
        } else {
          message = 'Email address could not be verified';
        }
      } else if (hasConfigViolations) {
        message = configViolations[0]; // Show first violation
      } else {
        message = `Email address verified successfully (${emailData.detail_info.smtp_provider})`;
      }

      // Calculate confidence score
      let confidence = 0;
      if (emailData.status === 'valid') confidence += 60;
      if (emailData.safe_to_send === 'yes') confidence += 30;
      if (emailData.gibberish === 'no') confidence += 10;

      console.log(`[CLEAROUT] Email validation completed in ${processingTime}ms - Valid: ${isValid}, Confidence: ${confidence}%`);

      return {
        isValid,
        message,
        confidence,
        details: {
          status: emailData.status,
          safe_to_send: emailData.safe_to_send,
          disposable: emailData.disposable,
          free: emailData.free,
          role: emailData.role,
          gibberish: emailData.gibberish,
          smtp_provider: emailData.detail_info.smtp_provider,
          processing_time: processingTime
        },
        suggestions: this.generateEmailSuggestions(email, emailData)
      };

    } catch (error) {
      console.error('[CLEAROUT] Email validation error:', error);
      return {
        isValid: false,
        message: 'Unable to validate email address. Please check your connection.',
        confidence: 0,
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Validate phone number using Clearout Phone API
   */
  async validatePhone(phone: string, country?: string, config?: ValidationConfig['phone']): Promise<ValidationResult> {
    try {
      console.log(`[CLEAROUT] Validating phone: ${phone}`);
      
      const startTime = Date.now();
      const response = await fetch(`${this.phoneApiUrl}phone_verify/instant`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          phone,
          ...(country && { country })
        })
      });

      const data: PhoneValidationResponse = await response.json() as PhoneValidationResponse;
      const processingTime = Date.now() - startTime;

      if (data.status === 'error') {
        console.error('[CLEAROUT] Phone validation error:', data.error_message);
        return {
          isValid: false,
          message: data.error_message || 'Phone validation failed',
          confidence: 0,
          details: { error_code: data.error_code }
        };
      }

      if (!data.data) {
        return {
          isValid: false,
          message: 'Invalid response from validation service',
          confidence: 0
        };
      }

      const phoneData = data.data;
      
      // Apply configuration rules
      const configViolations: string[] = [];
      
      if (config?.accept_mobile_only && phoneData.line_type !== 'mobile') {
        configViolations.push('Only mobile numbers are allowed');
      }
      
      if (config?.accept_landline_only && phoneData.line_type !== 'landline') {
        configViolations.push('Only landline numbers are allowed');
      }
      
      if (config?.block_voip && phoneData.line_type === 'voip') {
        configViolations.push('VOIP numbers are not allowed');
      }

      // Determine overall validation result
      const isBasicValid = phoneData.is_valid;
      const hasConfigViolations = configViolations.length > 0;
      
      const isValid = isBasicValid && !hasConfigViolations;
      
      // Generate user-friendly message
      let message = '';
      if (!isBasicValid) {
        message = 'Phone number is invalid or not reachable';
      } else if (hasConfigViolations) {
        message = configViolations[0]; // Show first violation
      } else {
        message = `Phone number verified successfully (${phoneData.line_type} - ${phoneData.carrier})`;
      }

      // Calculate confidence score
      let confidence = 0;
      if (phoneData.is_valid) confidence += 80;
      if (phoneData.line_type !== 'unknown') confidence += 10;
      if (phoneData.carrier) confidence += 10;

      console.log(`[CLEAROUT] Phone validation completed in ${processingTime}ms - Valid: ${isValid}, Confidence: ${confidence}%`);

      return {
        isValid,
        message,
        confidence,
        details: {
          is_valid: phoneData.is_valid,
          line_type: phoneData.line_type,
          carrier: phoneData.carrier,
          formatted_number: phoneData.formatted_number,
          location: phoneData.location,
          processing_time: processingTime
        },
        suggestions: phoneData.formatted_number !== phone ? [phoneData.formatted_number] : []
      };

    } catch (error) {
      console.error('[CLEAROUT] Phone validation error:', error);
      return {
        isValid: false,
        message: 'Unable to validate phone number. Please check your connection.',
        confidence: 0,
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Validate name field using basic rules
   */
  async validateName(name: string, config?: ValidationConfig['name']): Promise<ValidationResult> {
    try {
      console.log(`[CLEAROUT] Validating name: ${name}`);
      
      const startTime = Date.now();
      
      // Basic validation rules
      const configViolations: string[] = [];
      const cleanName = name.trim();
      
      // Length checks
      const minLength = config?.min_length || 2;
      const maxLength = config?.max_length || 100;
      
      if (cleanName.length < minLength) {
        configViolations.push(`Name must be at least ${minLength} characters long`);
      }
      
      if (cleanName.length > maxLength) {
        configViolations.push(`Name must be no more than ${maxLength} characters long`);
      }
      
      // Gibberish detection (basic)
      const isGibberish = this.detectGibberish(cleanName);
      if (config?.block_gibberish && isGibberish) {
        configViolations.push('Name appears to contain invalid characters or patterns');
      }
      
      // Character validation
      const hasValidCharacters = /^[a-zA-Z\s\-\.\'àâäéèêëïîôöùûüÿç]+$/i.test(cleanName);
      if (!hasValidCharacters) {
        configViolations.push('Name contains invalid characters');
      }
      
      // Word count validation (should have at least first name)
      const wordCount = cleanName.split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount === 0) {
        configViolations.push('Please enter a valid name');
      }

      const processingTime = Date.now() - startTime;
      const hasViolations = configViolations.length > 0;
      
      const isValid = !hasViolations;
      
      // Generate user-friendly message
      let message = '';
      if (hasViolations) {
        message = configViolations[0]; // Show first violation
      } else {
        message = `Name validated successfully`;
      }

      // Calculate confidence score
      let confidence = 0;
      if (cleanName.length >= minLength) confidence += 30;
      if (hasValidCharacters) confidence += 30;
      if (!isGibberish) confidence += 20;
      if (wordCount >= 2) confidence += 20; // First and last name

      console.log(`[CLEAROUT] Name validation completed in ${processingTime}ms - Valid: ${isValid}, Confidence: ${confidence}%`);

      return {
        isValid,
        message,
        confidence,
        details: {
          clean_name: cleanName,
          word_count: wordCount,
          character_count: cleanName.length,
          has_valid_characters: hasValidCharacters,
          is_gibberish: isGibberish,
          processing_time: processingTime
        },
        suggestions: this.generateNameSuggestions(cleanName)
      };

    } catch (error) {
      console.error('[CLEAROUT] Name validation error:', error);
      return {
        isValid: false,
        message: 'Unable to validate name. Please check your input.',
        confidence: 0,
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Validate multiple fields simultaneously
   */
  async validateMultipleFields(request: MultiFieldValidationRequest): Promise<MultiFieldValidationResult> {
    const startTime = Date.now();
    const results: MultiFieldValidationResult = {
      overall_score: 0,
      processing_time: 0
    };

    const validationPromises: Promise<void>[] = [];

    // Email validation
    if (request.email) {
      validationPromises.push(
        this.validateEmail(request.email, request.config?.email).then(result => {
          results.email = result;
        })
      );
    }

    // Phone validation
    if (request.phone) {
      validationPromises.push(
        this.validatePhone(request.phone, undefined, request.config?.phone).then(result => {
          results.phone = result;
        })
      );
    }

    // Name validation
    if (request.name) {
      validationPromises.push(
        this.validateName(request.name, request.config?.name).then(result => {
          results.name = result;
        })
      );
    }

    // Wait for all validations to complete
    await Promise.all(validationPromises);

    // Calculate overall score
    let totalScore = 0;
    let fieldCount = 0;

    if (results.email) {
      totalScore += results.email.confidence;
      fieldCount++;
    }
    if (results.phone) {
      totalScore += results.phone.confidence;
      fieldCount++;
    }
    if (results.name) {
      totalScore += results.name.confidence;
      fieldCount++;
    }

    results.overall_score = fieldCount > 0 ? Math.round(totalScore / fieldCount) : 0;
    results.processing_time = Date.now() - startTime;

    console.log(`[CLEAROUT] Multi-field validation completed in ${results.processing_time}ms - Overall score: ${results.overall_score}%`);

    return results;
  }

  /**
   * Generate email suggestions for common typos
   */
  private generateEmailSuggestions(email: string, data: any): string[] {
    const suggestions: string[] = [];
    
    // Common domain typos
    const domainSuggestions: { [key: string]: string } = {
      'gmail.co': 'gmail.com',
      'gmail.cm': 'gmail.com',
      'yahoo.co': 'yahoo.com',
      'hotmail.co': 'hotmail.com',
      'outlook.co': 'outlook.com'
    };

    const [localPart, domain] = email.split('@');
    if (domain && domainSuggestions[domain]) {
      suggestions.push(`${localPart}@${domainSuggestions[domain]}`);
    }

    return suggestions;
  }

  /**
   * Generate name suggestions for formatting
   */
  private generateNameSuggestions(name: string): string[] {
    const suggestions: string[] = [];
    const cleanName = name.trim();
    
    // Suggest proper case
    const properCase = cleanName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    if (properCase !== cleanName) {
      suggestions.push(properCase);
    }

    return suggestions;
  }

  /**
   * Basic gibberish detection for names
   */
  private detectGibberish(name: string): boolean {
    // Check for excessive consecutive consonants or vowels
    const consonantPattern = /[bcdfghjklmnpqrstvwxyz]{4,}/i;
    const vowelPattern = /[aeiou]{3,}/i;
    
    // Check for keyboard patterns
    const keyboardPatterns = [
      /qwerty/i, /asdf/i, /zxcv/i,
      /123/i, /abc/i
    ];

    return consonantPattern.test(name) || 
           vowelPattern.test(name) || 
           keyboardPatterns.some(pattern => pattern.test(name));
  }
}

// Export singleton instance
export const clearoutValidation = new ClearoutValidationService();