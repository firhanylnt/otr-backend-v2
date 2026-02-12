import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Sanitize input to prevent XSS attacks
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    return value;
  }

  private sanitizeString(str: string): string {
    // Remove potential XSS vectors
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          // Don't sanitize password fields
          if (key.toLowerCase().includes('password')) {
            sanitized[key] = value;
          } else {
            sanitized[key] = this.sanitizeString(value);
          }
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = Array.isArray(value)
            ? value.map((item) =>
                typeof item === 'string'
                  ? this.sanitizeString(item)
                  : typeof item === 'object'
                    ? this.sanitizeObject(item)
                    : item,
              )
            : this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }
}

