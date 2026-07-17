import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // El login con Google arranca en /~oauth/initiate, un endpoint que solo existe
      // en el hosting de Lovable; en localhost se proxea al dominio del proyecto,
      // que responde el 302 hacia oauth.lovable.app con redirect_uri de vuelta acá.
      "/~oauth": {
        target: "https://9661951d-8a06-4b89-bf07-311b97cc0e4b.lovableproject.com",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
