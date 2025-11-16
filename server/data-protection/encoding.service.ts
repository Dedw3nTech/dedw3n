/**
 * Encoding Service
 * 
 * Provides output encoding utilities to prevent XSS attacks and ensure
 * safe rendering of user-generated content in different contexts.
 */

/**
 * Encoding Service Class
 */
export class EncodingService {
  /**
   * Encode string for safe HTML context
   * Prevents XSS by encoding special HTML characters
   * 
   * @param str - String to encode
   * @returns HTML-safe encoded string
   */
  static encodeHtml(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return str.replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
  }

  /**
   * Encode string for safe HTML attribute context
   * 
   * @param str - String to encode
   * @returns Attribute-safe encoded string
   */
  static encodeHtmlAttribute(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    return str.replace(/[&<>"'`=]/g, (char) => {
      const charCode = char.charCodeAt(0);
      return `&#${charCode};`;
    });
  }

  /**
   * Encode string for safe JavaScript context
   * 
   * @param str - String to encode
   * @returns JavaScript-safe encoded string
   */
  static encodeJavaScript(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\//g, '\\/')
      .replace(/</g, '\\x3C')
      .replace(/>/g, '\\x3E');
  }

  /**
   * Encode string for safe JSON context
   * 
   * @param obj - Object to encode
   * @returns JSON-safe encoded string
   */
  static encodeJson(obj: any): string {
    try {
      return JSON.stringify(obj)
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E')
        .replace(/&/g, '\\u0026')
        .replace(/'/g, '\\u0027');
    } catch (error) {
      console.error('[ENCODING] JSON encoding error:', error);
      return '{}';
    }
  }

  /**
   * Encode string for safe URL context
   * 
   * @param str - String to encode
   * @returns URL-safe encoded string
   */
  static encodeUrl(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    return encodeURIComponent(str);
  }

  /**
   * Encode string for safe CSS context
   * 
   * @param str - String to encode
   * @returns CSS-safe encoded string
   */
  static encodeCss(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    // Replace special characters with CSS escape sequences
    return str.replace(/[^\w\s-]/g, (char) => {
      const charCode = char.charCodeAt(0);
      return `\\${charCode.toString(16)} `;
    });
  }

  /**
   * Decode HTML entities
   * 
   * @param str - String with HTML entities
   * @returns Decoded string
   */
  static decodeHtml(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&apos;': "'",
    };

    let decoded = str;
    for (const [entity, char] of Object.entries(htmlEntities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    // Decode numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
  }

  /**
   * Base64 encode
   * 
   * @param str - String to encode
   * @returns Base64 encoded string
   */
  static base64Encode(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    return Buffer.from(str, 'utf-8').toString('base64');
  }

  /**
   * Base64 decode
   * 
   * @param str - Base64 string to decode
   * @returns Decoded string
   */
  static base64Decode(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    try {
      return Buffer.from(str, 'base64').toString('utf-8');
    } catch (error) {
      console.error('[ENCODING] Base64 decoding error:', error);
      return '';
    }
  }

  /**
   * Encode object for safe data attributes
   * 
   * @param obj - Object to encode
   * @returns Safely encoded data attribute value
   */
  static encodeDataAttribute(obj: any): string {
    const json = this.encodeJson(obj);
    return this.encodeHtmlAttribute(json);
  }

  /**
   * Strip all HTML tags from a string
   * 
   * @param str - String with HTML
   * @returns String without HTML tags
   */
  static stripHtml(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    return str.replace(/<[^>]*>/g, '');
  }

  /**
   * Sanitize and encode for rich text output
   * Allows safe HTML tags but encodes dangerous content
   * 
   * @param html - HTML string
   * @param allowedTags - Array of allowed tag names
   * @returns Sanitized and encoded HTML
   */
  static encodeRichText(html: string, allowedTags: string[] = ['p', 'br', 'strong', 'em', 'u']): string {
    if (typeof html !== 'string') {
      return '';
    }

    // First, encode everything
    let encoded = this.encodeHtml(html);

    // Then, decode only allowed tags
    for (const tag of allowedTags) {
      const openingTag = new RegExp(`&lt;${tag}&gt;`, 'gi');
      const closingTag = new RegExp(`&lt;/${tag}&gt;`, 'gi');
      const selfClosing = new RegExp(`&lt;${tag}/&gt;`, 'gi');

      encoded = encoded.replace(openingTag, `<${tag}>`);
      encoded = encoded.replace(closingTag, `</${tag}>`);
      encoded = encoded.replace(selfClosing, `<${tag}/>`);
    }

    return encoded;
  }
}

/**
 * Convenience function for HTML encoding
 */
export function encodeHtml(str: string): string {
  return EncodingService.encodeHtml(str);
}

/**
 * Convenience function for JavaScript encoding
 */
export function encodeJs(str: string): string {
  return EncodingService.encodeJavaScript(str);
}

/**
 * Convenience function for URL encoding
 */
export function encodeUrl(str: string): string {
  return EncodingService.encodeUrl(str);
}
