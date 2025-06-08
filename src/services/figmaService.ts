
import { ApiService } from './apiService';

export interface FigmaValidationResponse {
  valid: boolean;
  fileId?: string;
  fileName?: string;
  lastModified?: string;
  thumbnailUrl?: string;
  message?: string;
}

export interface FigmaExtractionResponse {
  jobId: number;
  status: string;
}

export interface FigmaColorExtractionResponse {
  colorPalette: any[];
}

export class FigmaService {
  static async validateUrl(url: string, token: string): Promise<FigmaValidationResponse> {
    return ApiService.post<FigmaValidationResponse>('/figma/validate', { url, token });
  }

  static async extractComponents(url: string, token: string, userId?: number): Promise<FigmaExtractionResponse> {
    return ApiService.post<FigmaExtractionResponse>('/figma/extract', { url, token, userId });
  }

  static async extractColors(url: string, token: string): Promise<FigmaColorExtractionResponse> {
    return ApiService.post<FigmaColorExtractionResponse>('/figma/extract-colors', { url, token });
  }
}
