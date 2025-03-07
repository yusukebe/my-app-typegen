import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'typegen') {
    return {
      build: {
        lib: {
          entry: 'src/index.ts',
          name: 'types',
          formats: ['es']
        }
      },
      plugins: [
        dts({
          outDir: '.hono/types',
          declarationOnly: true,
          beforeWriteFile: (filePath) => {
            const newPath = filePath.replace(/(^\/.+\/)([^/]+\.d\.ts)$/, '$1+types/$2')
            return {
              filePath: newPath
            }
          }
        })
      ]
    }
  }
  return {}
})
