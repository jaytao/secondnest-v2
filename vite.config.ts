import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // secondnest.org is configured as this repo's own GitHub Pages custom domain
  // (see public/CNAME), which serves at the domain root — not the
  // /secondnest-v2/ subpath used by the old jaytao.github.io/secondnest-v2/ URL.
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
