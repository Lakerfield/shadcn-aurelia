import { defineConfig } from 'vite'
import aurelia from '@aurelia/vite-plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [aurelia({ useDev: true }), tailwindcss()],
  resolve: {
    alias: [{ find: '@', replacement: '/src' }],
  },
  server: {
    port: 9000,
  },
  esbuild: {
    target: 'es2022',
  },
})
