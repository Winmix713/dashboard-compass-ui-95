
import { ApiService } from './apiService';

export interface CssProcessingResponse {
  jobId: number;
  status: string;
}

export interface CssProcessingOptions {
  generateReact?: boolean;
  generateTailwind?: boolean;
  componentName?: string;
}

export class CssService {
  static async processCSS(
    cssCode: string, 
    options: CssProcessingOptions = {}, 
    userId?: number
  ): Promise<CssProcessingResponse> {
    return ApiService.post<CssProcessingResponse>('/css/process', { 
      cssCode, 
      options, 
      userId 
    });
  }
}
