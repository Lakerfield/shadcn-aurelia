import { defineConfig } from 'vite'
import aurelia from '@aurelia/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    aurelia({ useDev: true }),
    tailwindcss(),
    nodePolyfills(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  esbuild: {
    target: 'es2022',
  },
})
