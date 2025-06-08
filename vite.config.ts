
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { componentTagger } from "lovable-tagger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => ({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    mode === 'development' && componentTagger(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: mode === 'development',
  },
  server: {
    host: "::",
    port: 8080,
    fs: {
      strict: false,
      allow: [".."],
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  // Force Vite to use tsconfig.app.json for better path resolution
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
          "@shared/*": ["./shared/*"],
          "@assets/*": ["./attached_assets/*"]
        }
      }
    }
  }
}));
