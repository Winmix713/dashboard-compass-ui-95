/**
 * Performance optimization utilities for Figma Converter Pro
 */

// Debounce utility for reducing API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for limiting execution frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization cache for expensive computations
const memoCache = new Map<string, any>();

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = getKey(...args);
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    const result = func(...args);
    memoCache.set(key, result);
    return result;
  }) as T;
}

// Clear memoization cache
export function clearMemoCache(): void {
  memoCache.clear();
}

// CSS parsing optimization
export const optimizedCssParser = memoize(
  (cssCode: string) => {
    // Optimized CSS parsing with reduced complexity
    const rules: string[] = [];
    const colors = new Set<string>();
    const selectors = new Set<string>();
    
    // Split CSS into manageable chunks
    const lines = cssCode.split('\n');
    let currentRule = '';
    let inRule = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('/*')) continue;
      
      if (trimmed.includes('{')) {
        inRule = true;
        currentRule = trimmed;
        
        // Extract selector
        const selector = trimmed.split('{')[0].trim();
        if (selector) selectors.add(selector);
      } else if (trimmed.includes('}')) {
        if (inRule) {
          currentRule += ` ${trimmed}`;
          rules.push(currentRule);
          currentRule = '';
          inRule = false;
        }
      } else if (inRule) {
        currentRule += ` ${trimmed}`;
        
        // Extract colors efficiently
        const colorMatches = trimmed.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g);
        if (colorMatches) {
          colorMatches.forEach(color => colors.add(color));
        }
      }
    }
    
    return {
      rules,
      colors: Array.from(colors),
      selectors: Array.from(selectors),
      lineCount: lines.length
    };
  },
  (cssCode: string) => `css_${cssCode.length}_${cssCode.slice(0, 100)}`
);

// Component processing optimization
export function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5
): Promise<R[]> {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  return batches.reduce(async (acc, batch) => {
    const results = await acc;
    const batchResults = await Promise.all(batch.map(processor));
    return [...results, ...batchResults];
  }, Promise.resolve([] as R[]));
}

// Image optimization for Figma assets
export function optimizeImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return '';
  
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('format', 'webp');
  params.set('quality', '85');
  
  urlObj.search = params.toString();
  return urlObj.toString();
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  
  static startTimer(label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }
  
  static recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }
  
  static getAverageMetric(label: string): number {
    const values = this.metrics.get(label) || [];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  
  static getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    for (const [label, values] of Array.from(this.metrics.entries())) {
      result[label] = {
        average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        count: values.length
      };
    }
    
    return result;
  }
  
  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Error boundary helper
export function withErrorBoundary<T extends (...args: any[]) => any>(
  func: T,
  fallback: ReturnType<T>
): T {
  return ((...args: Parameters<T>) => {
    try {
      return func(...args);
    } catch (error) {
      console.error('Error in function:', func.name, error);
      return fallback;
    }
  }) as T;
}

// Local storage optimization
export class OptimizedStorage {
  private static cache = new Map<string, any>();
  
  static get<T>(key: string, defaultValue?: T): T | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        this.cache.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse localStorage item:', key, error);
    }
    
    return defaultValue;
  }
  
  static set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      this.cache.set(key, value);
    } catch (error) {
      console.warn('Failed to save to localStorage:', key, error);
    }
  }
  
  static remove(key: string): void {
    localStorage.removeItem(key);
    this.cache.delete(key);
  }
  
  static clear(): void {
    localStorage.clear();
    this.cache.clear();
  }
}