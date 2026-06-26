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
    // Bind to all network interfaces (not just localhost) and accept any Host
    // header, so the dev server is reachable from other devices on the LAN or
    // through a tunnel (e.g. testing mobile camera capture on a real phone).
    host: true,
    allowedHosts: true,
  },
})
