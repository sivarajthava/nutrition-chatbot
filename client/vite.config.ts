import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables from both client directory and root workspace directory
  const envClient = loadEnv(mode, __dirname, "");
  const envRoot = loadEnv(mode, process.cwd(), "");
  const targetServer =
    envClient.VITE_API_URL ||
    envRoot.VITE_API_URL ||
    process.env.VITE_API_URL ||
    "https://nutrition-chatbot-production.up.railway.app";

  const proxyConfig = {
    "/api": {
      target: targetServer,
      changeOrigin: true,
      secure: false,
      configure: (proxy: any) => {
        proxy.on("error", (err: any) => {
          console.error(`[vite proxy error] Target ${targetServer} error:`, err.message);
        });
      }
    }
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: proxyConfig
    },
    preview: {
      port: 5173,
      proxy: proxyConfig
    }
  };
});

