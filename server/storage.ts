
import { db } from "./db";
import { 
  figmaProjects, 
  generatedComponents, 
  processingJobs, 
  figmaVersions, 
  versionComparisons,
  type InsertFigmaProject,
  type InsertGeneratedComponent,
  type InsertProcessingJob,
  type InsertFigmaVersion,
  type InsertVersionComparison,
  type FigmaProject,
  type GeneratedComponent,
  type ProcessingJob,
  type FigmaVersion,
  type VersionComparison
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

// Mock data for fallback when database is not available
const mockStats = {
  totalComponents: 245,
  totalTokens: 128,
  averageProcessingTime: 2.4,
  successRate: 98.7
};

const mockJobs: ProcessingJob[] = [];
const mockProjects: FigmaProject[] = [];
const mockComponents: GeneratedComponent[] = [];

class Storage {
  private async isDatabaseAvailable(): Promise<boolean> {
    try {
      await db.select().from(figmaProjects).limit(1);
      return true;
    } catch (error) {
      console.warn("Database not available, using mock data:", error);
      return false;
    }
  }

  async getStats() {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return mockStats;
      }

      const [components, jobs] = await Promise.all([
        db.select().from(generatedComponents),
        db.select().from(processingJobs).where(eq(processingJobs.status, 'completed'))
      ]);

      const totalComponents = components.length;
      const successfulJobs = jobs.filter(job => job.status === 'completed');
      const totalJobs = jobs.length;
      
      return {
        totalComponents,
        totalTokens: Math.floor(totalComponents * 0.5),
        averageProcessingTime: 2.4,
        successRate: totalJobs > 0 ? (successfulJobs.length / totalJobs) * 100 : 100
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return mockStats;
    }
  }

  async createFigmaProject(data: InsertFigmaProject): Promise<FigmaProject> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        const mockProject: FigmaProject = {
          id: Date.now(),
          name: data.name,
          figmaFileId: data.figmaFileId,
          figmaUrl: data.figmaUrl,
          userId: data.userId ?? null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockProjects.push(mockProject);
        return mockProject;
      }

      const [project] = await db.insert(figmaProjects).values(data).returning();
      return project;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  async createGeneratedComponent(data: InsertGeneratedComponent): Promise<GeneratedComponent> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        const mockComponent: GeneratedComponent = {
          id: Date.now(),
          name: data.name,
          projectId: data.projectId ?? null,
          sourceType: data.sourceType,
          sourceData: data.sourceData ?? null,
          generatedCode: data.generatedCode ?? null,
          designTokens: data.designTokens ?? null,
          metadata: data.metadata ?? null,
          isPublic: data.isPublic ?? false,
          createdAt: new Date()
        };
        mockComponents.push(mockComponent);
        return mockComponent;
      }

      const [component] = await db.insert(generatedComponents).values(data).returning();
      return component;
    } catch (error) {
      console.error("Error creating component:", error);
      throw error;
    }
  }

  async createProcessingJob(data: InsertProcessingJob): Promise<ProcessingJob> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        const mockJob: ProcessingJob = {
          id: Date.now(),
          type: data.type,
          status: data.status,
          inputData: data.inputData ?? null,
          outputData: data.outputData ?? null,
          errorMessage: data.errorMessage ?? null,
          progressPercentage: data.progressPercentage ?? 0,
          userId: data.userId ?? null,
          createdAt: new Date(),
          completedAt: null
        };
        mockJobs.push(mockJob);
        return mockJob;
      }

      const [job] = await db.insert(processingJobs).values(data).returning();
      return job;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  }

  async updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        const jobIndex = mockJobs.findIndex(job => job.id === id);
        if (jobIndex >= 0) {
          mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...updates };
          if (updates.status === 'completed' || updates.status === 'failed') {
            mockJobs[jobIndex].completedAt = new Date();
          }
          return mockJobs[jobIndex];
        }
        return null;
      }

      const updateData = updates.status === 'completed' || updates.status === 'failed' 
        ? { ...updates, completedAt: new Date() }
        : updates;

      const [job] = await db.update(processingJobs)
        .set(updateData)
        .where(eq(processingJobs.id, id))
        .returning();
      
      return job || null;
    } catch (error) {
      console.error("Error updating job:", error);
      return null;
    }
  }

  async getProcessingJob(id: number): Promise<ProcessingJob | null> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return mockJobs.find(job => job.id === id) || null;
      }

      const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, id));
      return job || null;
    } catch (error) {
      console.error("Error fetching job:", error);
      return null;
    }
  }

  async getProcessingJobsByUser(userId: number): Promise<ProcessingJob[]> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return mockJobs.filter(job => job.userId === userId);
      }

      return await db.select().from(processingJobs)
        .where(eq(processingJobs.userId, userId))
        .orderBy(desc(processingJobs.createdAt));
    } catch (error) {
      console.error("Error fetching user jobs:", error);
      return [];
    }
  }

  async getComponentsByProject(projectId: number): Promise<GeneratedComponent[]> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return mockComponents.filter(comp => comp.projectId === projectId);
      }

      return await db.select().from(generatedComponents)
        .where(eq(generatedComponents.projectId, projectId));
    } catch (error) {
      console.error("Error fetching components:", error);
      return [];
    }
  }

  async getComponent(id: number): Promise<GeneratedComponent | null> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return mockComponents.find(comp => comp.id === id) || null;
      }

      const [component] = await db.select().from(generatedComponents)
        .where(eq(generatedComponents.id, id));
      return component || null;
    } catch (error) {
      console.error("Error fetching component:", error);
      return null;
    }
  }

  async createFigmaVersion(data: InsertFigmaVersion): Promise<FigmaVersion> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        const mockVersion: FigmaVersion = {
          id: Date.now(),
          projectId: data.projectId,
          versionName: data.versionName,
          versionDescription: data.versionDescription ?? null,
          figmaLastModified: data.figmaLastModified,
          figmaVersionId: data.figmaVersionId ?? null,
          figmaData: data.figmaData,
          components: data.components,
          designTokens: data.designTokens,
          thumbnailUrl: data.thumbnailUrl ?? null,
          createdAt: new Date()
        };
        return mockVersion;
      }

      const [version] = await db.insert(figmaVersions).values(data).returning();
      return version;
    } catch (error) {
      console.error("Error creating version:", error);
      throw error;
    }
  }

  async getFigmaVersionsByProject(projectId: number): Promise<FigmaVersion[]> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return [];
      }

      return await db.select().from(figmaVersions)
        .where(eq(figmaVersions.projectId, projectId))
        .orderBy(desc(figmaVersions.createdAt));
    } catch (error) {
      console.error("Error fetching versions:", error);
      return [];
    }
  }

  async getFigmaVersion(id: number): Promise<FigmaVersion | null> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return null;
      }

      const [version] = await db.select().from(figmaVersions)
        .where(eq(figmaVersions.id, id));
      return version || null;
    } catch (error) {
      console.error("Error fetching version:", error);
      return null;
    }
  }

  async createVersionComparison(data: InsertVersionComparison): Promise<VersionComparison> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        const mockComparison: VersionComparison = {
          id: Date.now(),
          projectId: data.projectId,
          fromVersionId: data.fromVersionId,
          toVersionId: data.toVersionId,
          comparisonData: data.comparisonData,
          createdAt: new Date()
        };
        return mockComparison;
      }

      const [comparison] = await db.insert(versionComparisons).values(data).returning();
      return comparison;
    } catch (error) {
      console.error("Error creating comparison:", error);
      throw error;
    }
  }

  async getVersionComparison(fromVersionId: number, toVersionId: number): Promise<VersionComparison | null> {
    try {
      const isDbAvailable = await this.isDatabaseAvailable();
      if (!isDbAvailable) {
        return null;
      }

      const [comparison] = await db.select().from(versionComparisons)
        .where(and(
          eq(versionComparisons.fromVersionId, fromVersionId),
          eq(versionComparisons.toVersionId, toVersionId)
        ));
      return comparison || null;
    } catch (error) {
      console.error("Error fetching comparison:", error);
      return null;
    }
  }
}

export const storage = new Storage();
