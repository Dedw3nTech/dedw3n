/**
 * Validation Service
 * 
 * Provides comprehensive data validation with support for custom rules,
 * built-in validators, and detailed error reporting.
 */

import type { ValidationRule, ValidationResult } from './types';

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation regex
 */
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Phone validation regex (international format)
 */
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

/**
 * Alphanumeric validation regex
 */
const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

/**
 * Numeric validation regex
 */
const NUMERIC_REGEX = /^[0-9]+$/;

/**
 * Validation Service Class
 */
export class ValidationService {
  /**
   * Validate a value against a single rule
   * 
   * @param value - The value to validate
   * @param rule - The validation rule
   * @returns ValidationResult
   */
  static validateRule(value: any, rule: ValidationRule): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
    };

    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          result.isValid = false;
          result.errors.push(rule.message || 'This field is required');
        }
        break;

      case 'email':
        if (value && !EMAIL_REGEX.test(String(value))) {
          result.isValid = false;
          result.errors.push(rule.message || 'Invalid email format');
        }
        break;

      case 'url':
        if (value && !URL_REGEX.test(String(value))) {
          result.isValid = false;
          result.errors.push(rule.message || 'Invalid URL format');
        }
        break;

      case 'phone':
        if (value && !PHONE_REGEX.test(String(value))) {
          result.isValid = false;
          result.errors.push(rule.message || 'Invalid phone number format');
        }
        break;

      case 'alphanumeric':
        if (value && !ALPHANUMERIC_REGEX.test(String(value))) {
          result.isValid = false;
          result.errors.push(rule.message || 'Only alphanumeric characters allowed');
        }
        break;

      case 'numeric':
        if (value && !NUMERIC_REGEX.test(String(value))) {
          result.isValid = false;
          result.errors.push(rule.message || 'Only numeric characters allowed');
        }
        break;

      case 'custom':
        if (rule.pattern && value && !rule.pattern.test(String(value))) {
          result.isValid = false;
          result.errors.push(rule.message || 'Invalid format');
        } else if (rule.validator && !rule.validator(value)) {
          result.isValid = false;
          result.errors.push(rule.message || 'Validation failed');
        }
        break;

      default:
        result.isValid = false;
        result.errors.push('Unknown validation rule type');
    }

    return result;
  }

  /**
   * Validate a value against multiple rules
   * 
   * @param value - The value to validate
   * @param rules - Array of validation rules
   * @returns ValidationResult
   */
  static validate(value: any, rules: ValidationRule[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      sanitizedValue: value,
    };

    for (const rule of rules) {
      const ruleResult = this.validateRule(value, rule);
      if (!ruleResult.isValid) {
        result.isValid = false;
        result.errors.push(...ruleResult.errors);
      }
    }

    return result;
  }

  /**
   * Validate an object against a schema of rules
   * 
   * @param obj - The object to validate
   * @param schema - Schema mapping field names to validation rules
   * @returns Record of field names to ValidationResults
   */
  static validateObject(
    obj: Record<string, any>,
    schema: Record<string, ValidationRule[]>
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const field in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, field)) {
        const value = obj[field];
        const rules = schema[field];
        results[field] = this.validate(value, rules);
      }
    }

    return results;
  }

  /**
   * Check if validation results contain any errors
   * 
   * @param results - Validation results
   * @returns true if valid, false if any errors
   */
  static isValid(results: Record<string, ValidationResult>): boolean {
    return Object.values(results).every((result) => result.isValid);
  }

  /**
   * Get all error messages from validation results
   * 
   * @param results - Validation results
   * @returns Array of error messages
   */
  static getErrors(results: Record<string, ValidationResult>): string[] {
    const errors: string[] = [];
    
    for (const field in results) {
      if (Object.prototype.hasOwnProperty.call(results, field)) {
        errors.push(...results[field].errors);
      }
    }

    return errors;
  }

  /**
   * Validate email format
   * 
   * @param email - Email to validate
   * @returns true if valid
   */
  static isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }

  /**
   * Validate URL format
   * 
   * @param url - URL to validate
   * @returns true if valid
   */
  static isValidUrl(url: string): boolean {
    return URL_REGEX.test(url);
  }

  /**
   * Validate phone format
   * 
   * @param phone - Phone number to validate
   * @returns true if valid
   */
  static isValidPhone(phone: string): boolean {
    return PHONE_REGEX.test(phone);
  }

  /**
   * Validate password strength
   * 
   * @param password - Password to validate
   * @param options - Password requirements
   * @returns ValidationResult
   */
  static validatePassword(
    password: string,
    options: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    } = {}
  ): ValidationResult {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
    } = options;

    const result: ValidationResult = {
      isValid: true,
      errors: [],
    };

    if (password.length < minLength) {
      result.isValid = false;
      result.errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one special character');
    }

    return result;
  }
}

/**
 * Convenience function for validating a single value
 */
export function validate(value: any, rules: ValidationRule[]): ValidationResult {
  return ValidationService.validate(value, rules);
}

/**
 * Convenience function for validating an object
 */
export function validateObject(
  obj: Record<string, any>,
  schema: Record<string, ValidationRule[]>
): Record<string, ValidationResult> {
  return ValidationService.validateObject(obj, schema);
}
