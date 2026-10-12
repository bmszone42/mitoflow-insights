import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Vercel detects Nitro during its build and applies the vercel preset.
// A local `vite build` stays on the Node preset so `vite preview` can run it.
export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro({
      vercel: {
        functions: {
          maxDuration: 60,
          supportsResponseStreaming: true,
        },
      },
    }),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
