import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, process.cwd(), "").VITE_BASE || "/",
  plugins: [vue()],
  server: {
    proxy: {
      "/socket.io": { target: "http://127.0.0.1:3001", ws: true },
      "/api": "http://127.0.0.1:3001",
    },
  },
}));
