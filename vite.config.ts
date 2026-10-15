// @lovable.dev/vite-tanstack-config supplies the TanStack Start plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({
  nitro: { preset: "vercel" },
  tanstackStart: {
    // Use src/server.ts as the SSR error wrapper.
    server: { entry: "server" },
  },
});
