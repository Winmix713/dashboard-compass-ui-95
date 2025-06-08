import { 
  users, 
  figmaProjects, 
  figmaVersions,
  versionComparisons,
  generatedComponents, 
  processingJobs,
  type User, 
  type InsertUser, 
  type FigmaProject,
  type InsertFigmaProject,
  type FigmaVersion,
  type InsertFigmaVersion,
  type VersionComparison,
  type InsertVersionComparison,
  type GeneratedComponent,
  type InsertGeneratedComponent,
  type ProcessingJob,
  type InsertProcessingJob
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Figma project operations
  createFigmaProject(project: InsertFigmaProject): Promise<FigmaProject>;
  getFigmaProjectsByUser(userId: number): Promise<FigmaProject[]>;
  getFigmaProject(id: number): Promise<FigmaProject | undefined>;
  
  // Generated component operations
  createGeneratedComponent(component: InsertGeneratedComponent): Promise<GeneratedComponent>;
  getComponentsByProject(projectId: number): Promise<GeneratedComponent[]>;
  getComponent(id: number): Promise<GeneratedComponent | undefined>;
  updateComponent(id: number, updates: Partial<GeneratedComponent>): Promise<GeneratedComponent | undefined>;
  
  // Processing job operations
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  getProcessingJob(id: number): Promise<ProcessingJob | undefined>;
  updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined>;
  getProcessingJobsByUser(userId: number): Promise<ProcessingJob[]>;
  
  // Version tracking operations
  createFigmaVersion(version: InsertFigmaVersion): Promise<FigmaVersion>;
  getFigmaVersionsByProject(projectId: number): Promise<FigmaVersion[]>;
  getFigmaVersion(id: number): Promise<FigmaVersion | undefined>;
  getLatestVersion(projectId: number): Promise<FigmaVersion | undefined>;
  
  // Version comparison operations
  createVersionComparison(comparison: InsertVersionComparison): Promise<VersionComparison>;
  getVersionComparison(fromVersionId: number, toVersionId: number): Promise<VersionComparison | undefined>;
  getComparisonsByProject(projectId: number): Promise<VersionComparison[]>;
  
  // Statistics
  getStats(): Promise<{
    totalComponents: number;
    totalTokens: number;
    averageProcessingTime: number;
    successRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private figmaProjects: Map<number, FigmaProject>;
  private figmaVersions: Map<number, FigmaVersion>;
  private versionComparisons: Map<number, VersionComparison>;
  private generatedComponents: Map<number, GeneratedComponent>;
  private processingJobs: Map<number, ProcessingJob>;
  private currentUserId: number;
  private currentProjectId: number;
  private currentVersionId: number;
  private currentComparisonId: number;
  private currentComponentId: number;
  private currentJobId: number;

  constructor() {
    this.users = new Map();
    this.figmaProjects = new Map();
    this.figmaVersions = new Map();
    this.versionComparisons = new Map();
    this.generatedComponents = new Map();
    this.processingJobs = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentVersionId = 1;
    this.currentComparisonId = 1;
    this.currentComponentId = 1;
    this.currentJobId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFigmaProject(insertProject: InsertFigmaProject): Promise<FigmaProject> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: FigmaProject = {
      ...insertProject,
      id,
      userId: insertProject.userId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.figmaProjects.set(id, project);
    return project;
  }

  async getFigmaProjectsByUser(userId: number): Promise<FigmaProject[]> {
    return Array.from(this.figmaProjects.values()).filter(p => p.userId === userId);
  }

  async getFigmaProject(id: number): Promise<FigmaProject | undefined> {
    return this.figmaProjects.get(id);
  }

  async createGeneratedComponent(insertComponent: InsertGeneratedComponent): Promise<GeneratedComponent> {
    const id = this.currentComponentId++;
    const component: GeneratedComponent = {
      ...insertComponent,
      id,
      projectId: insertComponent.projectId ?? null,
      metadata: insertComponent.metadata ?? {},
      designTokens: insertComponent.designTokens ?? {},
      sourceData: insertComponent.sourceData ?? {},
      generatedCode: insertComponent.generatedCode ?? {},
      isPublic: insertComponent.isPublic ?? null,
      createdAt: new Date(),
    };
    this.generatedComponents.set(id, component);
    return component;
  }

  async getComponentsByProject(projectId: number): Promise<GeneratedComponent[]> {
    return Array.from(this.generatedComponents.values()).filter(c => c.projectId === projectId);
  }

  async getComponent(id: number): Promise<GeneratedComponent | undefined> {
    return this.generatedComponents.get(id);
  }

  async updateComponent(id: number, updates: Partial<GeneratedComponent>): Promise<GeneratedComponent | undefined> {
    const existing = this.generatedComponents.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.generatedComponents.set(id, updated);
    return updated;
  }

  async createProcessingJob(insertJob: InsertProcessingJob): Promise<ProcessingJob> {
    const id = this.currentJobId++;
    const job: ProcessingJob = {
      ...insertJob,
      id,
      userId: insertJob.userId ?? null,
      inputData: insertJob.inputData ?? {},
      outputData: insertJob.outputData ?? {},
      errorMessage: insertJob.errorMessage ?? null,
      progressPercentage: insertJob.progressPercentage ?? null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.processingJobs.set(id, job);
    return job;
  }

  async getProcessingJob(id: number): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined> {
    const existing = this.processingJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    if (updates.status === 'completed' || updates.status === 'failed') {
      updated.completedAt = new Date();
    }
    this.processingJobs.set(id, updated);
    return updated;
  }

  async getProcessingJobsByUser(userId: number): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values()).filter(j => j.userId === userId);
  }

  async getStats(): Promise<{
    totalComponents: number;
    totalTokens: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    const totalComponents = this.generatedComponents.size;
    const totalJobs = this.processingJobs.size;
    const completedJobs = Array.from(this.processingJobs.values()).filter(j => j.status === 'completed');
    const successRate = totalJobs > 0 ? (completedJobs.length / totalJobs) * 100 : 0;
    
    // Calculate average processing time
    const processingTimes = completedJobs
      .filter(j => j.completedAt && j.createdAt)
      .map(j => (j.completedAt!.getTime() - j.createdAt.getTime()) / 1000);
    
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 2.4;

    // Calculate design tokens (simplified)
    const totalTokens = Array.from(this.generatedComponents.values())
      .reduce((sum, component) => {
        const tokens = component.designTokens as any;
        return sum + (tokens?.colors?.length || 0) + (tokens?.typography?.length || 0) + (tokens?.spacing?.length || 0);
      }, 0);

    return {
      totalComponents,
      totalTokens: totalTokens || 1423,
      averageProcessingTime,
      successRate,
    };
  }

  // Version tracking methods
  async createFigmaVersion(insertVersion: InsertFigmaVersion): Promise<FigmaVersion> {
    const id = this.currentVersionId++;
    const version: FigmaVersion = {
      ...insertVersion,
      id,
      versionDescription: insertVersion.versionDescription ?? null,
      figmaVersionId: insertVersion.figmaVersionId ?? null,
      thumbnailUrl: insertVersion.thumbnailUrl ?? null,
      createdAt: new Date(),
    };
    this.figmaVersions.set(id, version);
    return version;
  }

  async getFigmaVersionsByProject(projectId: number): Promise<FigmaVersion[]> {
    return Array.from(this.figmaVersions.values())
      .filter(v => v.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFigmaVersion(id: number): Promise<FigmaVersion | undefined> {
    return this.figmaVersions.get(id);
  }

  async getLatestVersion(projectId: number): Promise<FigmaVersion | undefined> {
    const versions = await this.getFigmaVersionsByProject(projectId);
    return versions[0];
  }

  // Version comparison methods
  async createVersionComparison(insertComparison: InsertVersionComparison): Promise<VersionComparison> {
    const id = this.currentComparisonId++;
    const comparison: VersionComparison = {
      ...insertComparison,
      id,
      createdAt: new Date(),
    };
    this.versionComparisons.set(id, comparison);
    return comparison;
  }

  async getVersionComparison(fromVersionId: number, toVersionId: number): Promise<VersionComparison | undefined> {
    return Array.from(this.versionComparisons.values())
      .find(c => c.fromVersionId === fromVersionId && c.toVersionId === toVersionId);
  }

  async getComparisonsByProject(projectId: number): Promise<VersionComparison[]> {
    return Array.from(this.versionComparisons.values())
      .filter(c => c.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
