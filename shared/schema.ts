import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const figmaProjects = pgTable("figma_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  figmaFileId: text("figma_file_id").notNull(),
  figmaUrl: text("figma_url").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const generatedComponents = pgTable("generated_components", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  projectId: integer("project_id").references(() => figmaProjects.id),
  sourceType: text("source_type").notNull(), // 'figma_url' | 'css_import' | 'batch'
  sourceData: jsonb("source_data"), // Store figma data or CSS code
  generatedCode: jsonb("generated_code"), // Store React, CSS, Tailwind code
  designTokens: jsonb("design_tokens"), // Store extracted design tokens
  metadata: jsonb("metadata"), // Store processing metadata
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const figmaVersions = pgTable("figma_versions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => figmaProjects.id).notNull(),
  versionName: text("version_name").notNull(),
  versionDescription: text("version_description"),
  figmaLastModified: text("figma_last_modified").notNull(),
  figmaVersionId: text("figma_version_id"),
  figmaData: jsonb("figma_data").notNull(), // Complete Figma file data
  components: jsonb("components").notNull(), // Extracted components
  designTokens: jsonb("design_tokens").notNull(), // Design tokens snapshot
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const versionComparisons = pgTable("version_comparisons", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => figmaProjects.id).notNull(),
  fromVersionId: integer("from_version_id").references(() => figmaVersions.id).notNull(),
  toVersionId: integer("to_version_id").references(() => figmaVersions.id).notNull(),
  comparisonData: jsonb("comparison_data").notNull(), // Changes analysis
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'figma_extraction' | 'css_processing' | 'batch_processing' | 'version_tracking'
  status: text("status").notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  progressPercentage: integer("progress_percentage").default(0),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFigmaProjectSchema = createInsertSchema(figmaProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedComponentSchema = createInsertSchema(generatedComponents).omit({
  id: true,
  createdAt: true,
});

export const insertFigmaVersionSchema = createInsertSchema(figmaVersions).omit({
  id: true,
  createdAt: true,
});

export const insertVersionComparisonSchema = createInsertSchema(versionComparisons).omit({
  id: true,
  createdAt: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FigmaProject = typeof figmaProjects.$inferSelect;
export type FigmaVersion = typeof figmaVersions.$inferSelect;
export type VersionComparison = typeof versionComparisons.$inferSelect;
export type GeneratedComponent = typeof generatedComponents.$inferSelect;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertFigmaProject = z.infer<typeof insertFigmaProjectSchema>;
export type InsertFigmaVersion = z.infer<typeof insertFigmaVersionSchema>;
export type InsertVersionComparison = z.infer<typeof insertVersionComparisonSchema>;
export type InsertGeneratedComponent = z.infer<typeof insertGeneratedComponentSchema>;
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
