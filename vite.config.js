import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 IMPORTANTE: cambia 'costelaciones' si tu repo se llama distinto
export default defineConfig({
  plugins: [react()],
  base: '/costelaciones/',
})
