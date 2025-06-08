
import type { Express } from "express";
import { storage } from "../storage";
import { generateReactComponentCode } from "../utils/figma";

export function cssRoutes(app: Express) {
  app.post("/api/css/process", async (req, res) => {
    try {
      const { cssCode, options = {}, userId = 1 } = req.body;
      
      if (!cssCode || typeof cssCode !== 'string') {
        return res.status(400).json({ message: "CSS code is required" });
      }

      const job = await storage.createProcessingJob({
        type: 'css_processing',
        status: 'processing',
        inputData: { cssCode, options },
        outputData: null,
        errorMessage: null,
        progressPercentage: 0,
        userId
      });

      // Process CSS
      setTimeout(async () => {
        try {
          await storage.updateProcessingJob(job.id, { progressPercentage: 30 });

          const cssRules = cssCode.match(/\/\*\s*([^*]+)\s*\*\/\s*[\s\S]*?(?=\/\*|$)/g) || [];
          const components = [];

          for (const rule of cssRules) {
            const nameMatch = rule.match(/\/\*\s*([^*]+)\s*\*\//);
            const componentName = nameMatch ? nameMatch[1].trim() : 'UnnamedComponent';
            
            if (componentName && !componentName.includes('Auto layout')) {
              const cssProperties = rule.match(/[a-z-]+:\s*[^;]+;/g) || [];
              const generatedCode = generateReactComponentCode({ name: componentName }, {});
              
              components.push({
                name: componentName,
                cssProperties,
                generatedCode
              });
            }
          }

          await storage.updateProcessingJob(job.id, { progressPercentage: 70 });

          const project = await storage.createFigmaProject({
            name: 'CSS Import Project',
            figmaFileId: 'css-import',
            figmaUrl: 'css-import',
            userId
          });

          const savedComponents = [];
          for (const component of components) {
            const saved = await storage.createGeneratedComponent({
              name: component.name,
              projectId: project.id,
              sourceType: 'css_import',
              sourceData: { cssCode: cssCode },
              generatedCode: component.generatedCode,
              designTokens: { colors: [], typography: [], spacing: [] },
              metadata: {
                extractedAt: new Date().toISOString(),
                cssRulesCount: component.cssProperties.length
              },
              isPublic: false
            });
            savedComponents.push(saved);
          }

          await storage.updateProcessingJob(job.id, { 
            status: 'completed',
            progressPercentage: 100,
            outputData: { 
              projectId: project.id,
              componentsCount: savedComponents.length
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
      res.status(500).json({ message: "CSS processing failed" });
    }
  });
}
