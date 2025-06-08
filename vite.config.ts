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
  // Force correct TypeScript path resolution - override the wrong tsconfig.json
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
          "@shared/*": ["./shared/*"],
          "@assets/*": ["./attached_assets/*"]
        },
        jsx: "react-jsx",
        target: "ES2020",
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        strict: false
      }
    }
  },
  // Also ensure TypeScript uses the correct config
  define: {
    __DEV__: mode === 'development'
  }
}));
