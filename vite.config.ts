// vite.config.ts
import { defineConfig } from 'vite'
import typegenPlugin from './vite-plugin'

export default defineConfig({
  plugins: [
    typegenPlugin({
      entry: './src/server/app.ts'
    })
  ]
})
