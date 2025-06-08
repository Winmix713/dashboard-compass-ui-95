
import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { fetchFigmaFile, extractComponentsFromFigmaData, generateReactComponentCode, extractDesignTokens } from "../utils/figma";

export function figmaRoutes(app: Express) {
  // Validate Figma URL
  app.post("/api/figma/validate", async (req, res) => {
    try {
      const { url, token } = req.body;
      
      if (!url || !token) {
        return res.status(400).json({ message: "URL and token are required" });
      }

      const fileIdMatch = url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL format" });
      }

      const fileId = fileIdMatch[2];

      try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
          method: 'GET',
          headers: {
            'X-Figma-Token': token,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        res.json({
          valid: true,
          fileId,
          fileName: data.name,
          lastModified: data.lastModified,
          thumbnailUrl: data.thumbnailUrl
        });
      } catch (apiError) {
        res.status(401).json({ 
          valid: false, 
          message: "Invalid token or insufficient permissions" 
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Validation failed" });
    }
  });

  // Extract components from Figma
  app.post("/api/figma/extract", async (req, res) => {
    try {
      const { url, token, userId = 1 } = req.body;
      
      const validation = z.object({
        url: z.string().url(),
        token: z.string().min(1),
        userId: z.number().optional()
      }).parse(req.body);

      const fileIdMatch = validation.url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL" });
      }

      const fileId = fileIdMatch[2];

      const job = await storage.createProcessingJob({
        type: 'figma_extraction',
        status: 'processing',
        inputData: { url: validation.url, fileId },
        outputData: null,
        errorMessage: null,
        progressPercentage: 0,
        userId: validation.userId || 1
      });

      // Process in background
      setTimeout(async () => {
        try {
          await storage.updateProcessingJob(job.id, { progressPercentage: 25 });

          const figmaData = await fetchFigmaFile(fileId, validation.token);
          await storage.updateProcessingJob(job.id, { progressPercentage: 50 });

          const components = await extractComponentsFromFigmaData(figmaData);
          await storage.updateProcessingJob(job.id, { progressPercentage: 75 });

          const designTokens = extractDesignTokens(figmaData);

          const project = await storage.createFigmaProject({
            name: figmaData.name || 'Unnamed Project',
            figmaFileId: fileId,
            figmaUrl: validation.url,
            userId: validation.userId || 1
          });

          const generatedComponents = [];
          for (const component of components) {
            const generatedCode = generateReactComponentCode(component, designTokens);
            
            const savedComponent = await storage.createGeneratedComponent({
              name: component.name,
              projectId: project.id,
              sourceType: 'figma_url',
              sourceData: component,
              generatedCode,
              designTokens,
              metadata: {
                figmaNodeId: component.id,
                extractedAt: new Date().toISOString()
              },
              isPublic: false
            });

            generatedComponents.push(savedComponent);
          }

          await storage.updateProcessingJob(job.id, { 
            status: 'completed',
            progressPercentage: 100,
            outputData: { 
              projectId: project.id,
              componentsCount: generatedComponents.length,
              designTokens 
            }
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Extraction failed" });
    }
  });

  // Extract colors from Figma
  app.post("/api/figma/extract-colors", async (req, res) => {
    try {
      const { url, token } = req.body;
      
      const validation = z.object({
        url: z.string().url(),
        token: z.string().min(1)
      }).parse(req.body);

      const fileIdMatch = validation.url.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!fileIdMatch) {
        return res.status(400).json({ message: "Invalid Figma URL" });
      }

      const fileId = fileIdMatch[2];
      const figmaData = await fetchFigmaFile(fileId, validation.token);
      const { extractColorPaletteFromFigmaData } = await import("../utils/figma");
      const colorPalette = extractColorPaletteFromFigmaData(figmaData);

      res.json({ colorPalette });

    } catch (error) {
      res.status(500).json({ message: "Color extraction failed" });
    }
  });
}
