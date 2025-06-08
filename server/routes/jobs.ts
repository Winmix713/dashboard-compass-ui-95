
import type { Express } from "express";
import { storage } from "../storage";

export function jobRoutes(app: Express) {
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getProcessingJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job status" });
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const jobs = await storage.getProcessingJobsByUser(userId);
      const recentJobs = jobs.slice(-10).reverse();
      res.json(recentJobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/projects/:id/components", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const components = await storage.getComponentsByProject(projectId);
      res.json(components);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch components" });
    }
  });

  app.get("/api/components/:id", async (req, res) => {
    try {
      const componentId = parseInt(req.params.id);
      const component = await storage.getComponent(componentId);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }

      res.json(component);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch component" });
    }
  });
}
