import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Electron loads the built index.html via file://, not from a server root,
  // so asset URLs must be relative ("./assets/...") rather than absolute
  // ("/assets/...") or the packaged app shows a blank white window.
  base: "./",
})
