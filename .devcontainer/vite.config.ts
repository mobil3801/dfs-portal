import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(() => {
  const isVitestVscode = process.env.VITEST_VSCODE

  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
    },
    test: isVitestVscode ? {
      reporter: 'verbose',
      include: ['**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    } : undefined,
  }
})
