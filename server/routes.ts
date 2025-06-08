
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFigmaProjectSchema, insertGeneratedComponentSchema, insertProcessingJobSchema } from "@shared/schema";
import { z } from "zod";
import { figmaRoutes } from "./routes/figma";
import { cssRoutes } from "./routes/css";
import { jobRoutes } from "./routes/jobs";
import { versionRoutes } from "./routes/versions";
import { designRoutes } from "./routes/design";
import { settingsRoutes } from "./routes/settings";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.json({
        totalComponents: 0,
        totalTokens: 0,
        averageProcessingTime: 0,
        successRate: 0
      });
    }
  });

  // Register route modules
  figmaRoutes(app);
  cssRoutes(app);
  jobRoutes(app);
  versionRoutes(app);
  designRoutes(app);
  settingsRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
