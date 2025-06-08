
import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { fetchFigmaFile, extractComponentsFromFigmaData, extractDesignTokens } from "../utils/figma";

export function versionRoutes(app: Express) {
  app.post("/api/versions/create", async (req, res) => {
    try {
      const { projectId, url, token, versionName, versionDescription } = req.body;
      
      const validation = z.object({
        projectId: z.number(),
        url: z.string().url(),
        token: z.string().min(1),
        versionName: z.string().min(1),
        versionDescription: z.string().optional()
      }).parse(req.body);

      const fileIdMatch = validation.url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL" });
      }

      const fileId = fileIdMatch[2];

      const job = await storage.createProcessingJob({
        type: 'version_tracking',
        status: 'processing',
        inputData: { projectId: validation.projectId, url: validation.url, fileId, versionName: validation.versionName },
        outputData: null,
        errorMessage: null,
        progressPercentage: 0,
        userId: 1
      });

      setTimeout(async () => {
        try {
          await storage.updateProcessingJob(job.id, { progressPercentage: 25 });

          const figmaData = await fetchFigmaFile(fileId, validation.token);
          await storage.updateProcessingJob(job.id, { progressPercentage: 50 });

          const components = await extractComponentsFromFigmaData(figmaData);
          const designTokens = extractDesignTokens(figmaData);
          await storage.updateProcessingJob(job.id, { progressPercentage: 75 });

          const version = await storage.createFigmaVersion({
            projectId: validation.projectId,
            versionName: validation.versionName,
            versionDescription: validation.versionDescription || '',
            figmaLastModified: figmaData.lastModified,
            figmaVersionId: figmaData.version,
            figmaData: figmaData,
            components: components,
            designTokens: designTokens,
            thumbnailUrl: figmaData.thumbnailUrl
          });

          await storage.updateProcessingJob(job.id, { 
            status: 'completed',
            progressPercentage: 100,
            outputData: { versionId: version.id }
          });

        } catch (error) {
          await storage.updateProcessingJob(job.id, { 
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            progressPercentage: 100
          });
        }
      }, 100);

      res.json({ jobId: job.id, status: 'processing' });

    } catch (error) {
      res.status(500).json({ message: "Version creation failed" });
    }
  });

  app.get("/api/versions/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const versions = await storage.getFigmaVersionsByProject(projectId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  app.post("/api/versions/compare", async (req, res) => {
    try {
      const { fromVersionId, toVersionId } = req.body;
      
      const validation = z.object({
        fromVersionId: z.number(),
        toVersionId: z.number()
      }).parse(req.body);

      const existingComparison = await storage.getVersionComparison(
        validation.fromVersionId, 
        validation.toVersionId
      );

      if (existingComparison) {
        return res.json(existingComparison);
      }

      const fromVersion = await storage.getFigmaVersion(validation.fromVersionId);
      const toVersion = await storage.getFigmaVersion(validation.toVersionId);

      if (!fromVersion || !toVersion) {
        return res.status(404).json({ message: "Version not found" });
      }

      const comparisonData = {
        changes: { added: [], removed: [], modified: [] },
        colorChanges: [],
        typographyChanges: [],
        summary: { totalChanges: 0, componentChanges: 0, designTokenChanges: 0 }
      };

      const comparison = await storage.createVersionComparison({
        projectId: fromVersion.projectId,
        fromVersionId: validation.fromVersionId,
        toVersionId: validation.toVersionId,
        comparisonData: comparisonData
      });

      res.json(comparison);

    } catch (error) {
      res.status(500).json({ message: "Version comparison failed" });
    }
  });
}
