
import { ApiService } from './apiService';

export interface ProcessingJob {
  id: number;
  type: string;
  status: 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  errorMessage?: string;
  outputData?: any;
  inputData?: any;
  createdAt: string;
  updatedAt: string;
}

export class JobService {
  static async getJob(jobId: number): Promise<ProcessingJob> {
    return ApiService.get<ProcessingJob>(`/jobs/${jobId}`);
  }

  static async getUserJobs(userId: number): Promise<ProcessingJob[]> {
    return ApiService.get<ProcessingJob[]>(`/jobs?userId=${userId}`);
  }

  static async getProjectComponents(projectId: number): Promise<any[]> {
    return ApiService.get<any[]>(`/projects/${projectId}/components`);
  }

  static async getComponent(componentId: number): Promise<any> {
    return ApiService.get<any>(`/components/${componentId}`);
  }
}
