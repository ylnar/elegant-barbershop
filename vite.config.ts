import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Code splitting optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'vendor-react': ['react', 'react-dom'],
            'vendor-lucide': ['lucide-react'],
            'vendor-motion': ['motion'],
          },
          // Asset file naming with content hash for cache busting
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      // Increase chunk warning limit
      chunkSizeWarningLimit: 1000,
      // Minification (default esbuild)
      minify: true,
      // Source maps for production debugging (optional)
      sourcemap: false,
      // Target modern browsers
      target: 'es2020',
    },
    // Optimize deps
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
    },
  };
});
