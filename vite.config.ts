import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { componentTagger } from "lovable-tagger";
import tsconfigPaths from "vite-tsconfig-paths"; // ✅ TS config path plugin

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
    mode === "development" && componentTagger(),
    tsconfigPaths({
      projects: [path.resolve(__dirname, "tsconfig.app.json")], // ✅ Use only the correct TS config
    }),
  ];

  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return {
    plugins: plugins.filter(Boolean),
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
      sourcemap: mode === "development",
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
    define: {
      __DEV__: mode === "development",
    },
  };
});
