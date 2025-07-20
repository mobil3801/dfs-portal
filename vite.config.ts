import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true // This enables client-side routing
  },
  plugins: [
  react()],


  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-core': ['react', 'react-dom'],

          // Router and navigation
          'routing': ['react-router-dom'],

          // UI Libraries
          'radix-ui': [
          '@radix-ui/react-accordion',
          '@radix-ui/react-alert-dialog',
          '@radix-ui/react-aspect-ratio',
          '@radix-ui/react-avatar',
          '@radix-ui/react-checkbox',
          '@radix-ui/react-collapsible',
          '@radix-ui/react-context-menu',
          '@radix-ui/react-dialog',
          '@radix-ui/react-dropdown-menu',
          '@radix-ui/react-hover-card',
          '@radix-ui/react-label',
          '@radix-ui/react-menubar',
          '@radix-ui/react-navigation-menu',
          '@radix-ui/react-popover',
          '@radix-ui/react-progress',
          '@radix-ui/react-radio-group',
          '@radix-ui/react-scroll-area',
          '@radix-ui/react-select',
          '@radix-ui/react-separator',
          '@radix-ui/react-slider',
          '@radix-ui/react-slot',
          '@radix-ui/react-switch',
          '@radix-ui/react-tabs',
          '@radix-ui/react-toast',
          '@radix-ui/react-toggle',
          '@radix-ui/react-toggle-group',
          '@radix-ui/react-tooltip'],


          // Forms and validation
          'forms': [
          'react-hook-form',
          '@hookform/resolvers',
          'zod'],


          // Data management
          'data-management': [
          '@tanstack/react-query'],


          // Charts and visualization
          'charts': [
          'recharts'],


          // Animations and motion
          'animations': [
          'motion',
          'framer-motion'],


          // Utilities
          'utilities': [
          'clsx',
          'tailwind-merge',
          'class-variance-authority',
          'cmdk',
          'date-fns',
          'lucide-react',
          'sonner'],


          // Specialized features
          'specialized': [
          'embla-carousel-react',
          'input-otp',
          'next-themes',
          'react-day-picker',
          'react-resizable-panels',
          'react-dropzone',
          'vaul',
          'i18next',
          'react-i18next',
          '@dnd-kit/core',
          '@monaco-editor/react']

        }
      }
    },

    // Increase chunk size warning limit to 1MB (1000 kB)
    chunkSizeWarningLimit: 1000,

    // Target modern browsers for better optimization
    target: 'esnext',

    // Enable minification
    minify: 'terser',

    // Enable source maps for better debugging
    sourcemap: mode === 'development'
  }
}));