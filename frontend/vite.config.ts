import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Garante que os links funcionem na raiz
  build: {
    outDir: 'dist', // Força a saída para a pasta 'dist'
  }
})