import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const TIMEZONE_OFFSET = 7 * 60; // Jakarta UTC+7 in minutes

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.transformDates(data)),
    );
  }

  private toJakartaTime(date: Date): string {
    // Convert UTC to Jakarta time (UTC+7)
    const jakartaDate = new Date(date.getTime() + TIMEZONE_OFFSET * 60 * 1000);
    return jakartaDate.toISOString().replace('Z', '+07:00');
  }

  private isDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    // Check if it's an ISO date string
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return isoDateRegex.test(value);
  }

  private transformDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      return this.toJakartaTime(obj);
    }

    // Handle ISO date strings that might have been serialized
    if (this.isDateString(obj)) {
      return this.toJakartaTime(new Date(obj));
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformDates(item));
    }

    if (typeof obj === 'object') {
      const transformed: any = {};
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (value instanceof Date) {
          transformed[key] = this.toJakartaTime(value);
        } else if (this.isDateString(value)) {
          transformed[key] = this.toJakartaTime(new Date(value));
        } else if (typeof value === 'object' && value !== null) {
          transformed[key] = this.transformDates(value);
        } else {
          transformed[key] = value;
        }
      }
      return transformed;
    }

    return obj;
  }
}
