/**
 * Comprehensive error handling and recovery system for Figma Converter Pro
 */

export interface ErrorDetails {
  code: string;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userAction?: string;
  recoverable: boolean;
}

export class FigmaConverterError extends Error {
  constructor(
    public details: ErrorDetails
  ) {
    super(details.message);
    this.name = 'FigmaConverterError';
  }
}

// Error categories for better handling
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  FIGMA_API = 'FIGMA_API',
  VALIDATION = 'VALIDATION',
  PROCESSING = 'PROCESSING',
  STORAGE = 'STORAGE',
  AUTHENTICATION = 'AUTHENTICATION'
}

// Error recovery strategies
export class ErrorRecovery {
  private static retryAttempts = new Map<string, number>();
  private static maxRetries = 3;
  
  static async withRetry<T>(
    operation: () => Promise<T>,
    category: ErrorCategory,
    context?: Record<string, any>
  ): Promise<T> {
    const operationId = `${category}_${Date.now()}`;
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        const result = await operation();
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        attempts++;
        this.retryAttempts.set(operationId, attempts);
        
        if (attempts >= this.maxRetries) {
          throw this.createRecoverableError(error, category, context, attempts);
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Maximum retry attempts exceeded');
  }
  
  private static createRecoverableError(
    error: any,
    category: ErrorCategory,
    context?: Record<string, any>,
    attempts?: number
  ): FigmaConverterError {
    const details: ErrorDetails = {
      code: `${category}_ERROR`,
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date(),
      context: { ...context, attempts },
      recoverable: this.isRecoverable(category, error),
      userAction: this.getUserAction(category, error)
    };
    
    return new FigmaConverterError(details);
  }
  
  private static isRecoverable(category: ErrorCategory, error: any): boolean {
    switch (category) {
      case ErrorCategory.NETWORK:
        return !error.message?.includes('401') && !error.message?.includes('403');
      case ErrorCategory.FIGMA_API:
        return error.status !== 401 && error.status !== 403;
      case ErrorCategory.VALIDATION:
        return false; // Validation errors require user correction
      case ErrorCategory.PROCESSING:
        return true; // Most processing errors can be retried
      case ErrorCategory.STORAGE:
        return true;
      case ErrorCategory.AUTHENTICATION:
        return false; // Auth errors require user intervention
      default:
        return false;
    }
  }
  
  private static getUserAction(category: ErrorCategory, error: any): string {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'Check your internet connection and try again';
      case ErrorCategory.FIGMA_API:
        if (error.status === 401 || error.status === 403) {
          return 'Please check your Figma access token in Settings';
        }
        return 'Figma service temporarily unavailable, please try again';
      case ErrorCategory.VALIDATION:
        return 'Please check your input and correct any validation errors';
      case ErrorCategory.PROCESSING:
        return 'Processing failed, please try again or contact support';
      case ErrorCategory.STORAGE:
        return 'Storage error occurred, please try again';
      case ErrorCategory.AUTHENTICATION:
        return 'Please log in again or check your credentials';
      default:
        return 'An error occurred, please try again or contact support';
    }
  }
}

// Figma API specific error handling
export class FigmaApiErrorHandler {
  static handleResponse(response: Response): void {
    if (!response.ok) {
      switch (response.status) {
        case 401:
          throw new FigmaConverterError({
            code: 'FIGMA_UNAUTHORIZED',
            message: 'Invalid or expired Figma access token',
            timestamp: new Date(),
            recoverable: false,
            userAction: 'Please update your Figma access token in Settings'
          });
        case 403:
          throw new FigmaConverterError({
            code: 'FIGMA_FORBIDDEN',
            message: 'Access denied to Figma file',
            timestamp: new Date(),
            recoverable: false,
            userAction: 'Check file permissions or verify the file URL'
          });
        case 404:
          throw new FigmaConverterError({
            code: 'FIGMA_NOT_FOUND',
            message: 'Figma file not found',
            timestamp: new Date(),
            recoverable: false,
            userAction: 'Verify the Figma file URL is correct'
          });
        case 429:
          throw new FigmaConverterError({
            code: 'FIGMA_RATE_LIMIT',
            message: 'Figma API rate limit exceeded',
            timestamp: new Date(),
            recoverable: true,
            userAction: 'Please wait a moment before trying again'
          });
        default:
          throw new FigmaConverterError({
            code: 'FIGMA_API_ERROR',
            message: `Figma API error: ${response.status}`,
            timestamp: new Date(),
            recoverable: true,
            userAction: 'Please try again in a few moments'
          });
      }
    }
  }
}

// Validation error handling
export class ValidationErrorHandler {
  static validateFigmaUrl(url: string): void {
    if (!url) {
      throw new FigmaConverterError({
        code: 'VALIDATION_EMPTY_URL',
        message: 'Figma URL is required',
        timestamp: new Date(),
        recoverable: false,
        userAction: 'Please enter a valid Figma file URL'
      });
    }
    
    const figmaUrlPattern = /^https:\/\/(www\.)?figma\.com\/(file|proto)\/[A-Za-z0-9]{22,128}/;
    if (!figmaUrlPattern.test(url)) {
      throw new FigmaConverterError({
        code: 'VALIDATION_INVALID_URL',
        message: 'Invalid Figma URL format',
        timestamp: new Date(),
        recoverable: false,
        userAction: 'Please enter a valid Figma file URL (e.g., https://figma.com/file/...)'
      });
    }
  }
  
  static validateAccessToken(token: string): void {
    if (!token) {
      throw new FigmaConverterError({
        code: 'VALIDATION_EMPTY_TOKEN',
        message: 'Figma access token is required',
        timestamp: new Date(),
        recoverable: false,
        userAction: 'Please configure your Figma access token in Settings'
      });
    }
    
    if (token.length < 10) {
      throw new FigmaConverterError({
        code: 'VALIDATION_INVALID_TOKEN',
        message: 'Invalid Figma access token format',
        timestamp: new Date(),
        recoverable: false,
        userAction: 'Please check your Figma access token in Settings'
      });
    }
  }
  
  static validateCssCode(cssCode: string): void {
    if (!cssCode.trim()) {
      throw new FigmaConverterError({
        code: 'VALIDATION_EMPTY_CSS',
        message: 'CSS code is required',
        timestamp: new Date(),
        recoverable: false,
        userAction: 'Please enter valid CSS code'
      });
    }
    
    // Basic CSS syntax validation
    const openBraces = (cssCode.match(/{/g) || []).length;
    const closeBraces = (cssCode.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      throw new FigmaConverterError({
        code: 'VALIDATION_INVALID_CSS',
        message: 'Invalid CSS syntax: mismatched braces',
        timestamp: new Date(),
        recoverable: false,
        userAction: 'Please check your CSS syntax for missing or extra braces'
      });
    }
  }
}

// Global error reporter
export class ErrorReporter {
  private static errors: ErrorDetails[] = [];
  private static maxErrors = 100;
  
  static report(error: FigmaConverterError): void {
    this.errors.unshift(error.details);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('FigmaConverter Error:', error.details);
    }
    
    // Report to analytics in production (if configured)
    this.reportToAnalytics(error.details);
  }
  
  private static reportToAnalytics(error: ErrorDetails): void {
    // Only report in production with analytics configured
    if (process.env.NODE_ENV === 'production' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: !error.recoverable,
        custom_map: {
          error_code: error.code,
          error_category: error.code.split('_')[0]
        }
      });
    }
  }
  
  static getRecentErrors(limit: number = 10): ErrorDetails[] {
    return this.errors.slice(0, limit);
  }
  
  static getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const error of this.errors) {
      const category = error.code.split('_')[0];
      stats[category] = (stats[category] || 0) + 1;
    }
    
    return stats;
  }
  
  static clearErrors(): void {
    this.errors = [];
  }
}

// Error boundary hook for React components
export function useErrorHandler() {
  return {
    handleError: (error: any, context?: Record<string, any>) => {
      if (error instanceof FigmaConverterError) {
        ErrorReporter.report(error);
        return error;
      }
      
      const figmaError = new FigmaConverterError({
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date(),
        context,
        recoverable: true,
        userAction: 'Please try again or contact support if the problem persists'
      });
      
      ErrorReporter.report(figmaError);
      return figmaError;
    },
    
    withErrorHandling: async <T>(
      operation: () => Promise<T>,
      category: ErrorCategory,
      context?: Record<string, any>
    ): Promise<T> => {
      try {
        return await ErrorRecovery.withRetry(operation, category, context);
      } catch (error) {
        throw error instanceof FigmaConverterError ? error : new FigmaConverterError({
          code: `${category}_ERROR`,
          message: error.message || 'Operation failed',
          timestamp: new Date(),
          context,
          recoverable: ErrorRecovery['isRecoverable'](category, error),
          userAction: ErrorRecovery['getUserAction'](category, error)
        });
      }
    }
  };
}