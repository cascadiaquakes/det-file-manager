import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite treats .jsx as JSX by default; this project keeps JSX in .js files
// (a CRA convention), so we tell esbuild to parse .js as JSX too.
export default defineConfig({
  plugins: [react()],
  // Relative base so the same build works at both the prod root
  // (/) and the dev path (/dev/) without a per-environment rebuild.
  base: './',
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.(js|jsx)$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
