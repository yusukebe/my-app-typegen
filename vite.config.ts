import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import typegenPlugin from './vite-plugin'

const entry = './src/server/app.ts'

export default defineConfig({
  plugins: [devServer({ entry }), typegenPlugin({ entry })]
})
