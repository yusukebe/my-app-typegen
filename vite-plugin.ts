import { Plugin } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

interface TypegenOptions {
  entry?: string
  outDir?: string
  include?: string[]
  beforeWriteFile?: (filePath: string) => { filePath: string } | undefined
}

export const defaultOption: Required<TypegenOptions> = {
  entry: 'src/index.ts',
  outDir: '.hono/types/src',
  include: ['./src/**/*.ts', './src/**/*.tsx'],
  beforeWriteFile: (filePath: string) => {
    const newPath = filePath.replace(/(^\/.+\/)([^/]+\.d\.ts)$/, '$1+types/$2')
    return { filePath: newPath }
  }
}

/**
 * Creates a Vite plugin that generates TypeScript declaration files.
 * Supports both build mode and development mode with file watching.
 */
export function typegenPlugin(options: TypegenOptions): Plugin[] {
  const entry = options.entry ?? defaultOption.entry
  const outDir = options.outDir ?? defaultOption.outDir
  const include = options.include ?? defaultOption.include
  const beforeWriteFile = options.beforeWriteFile ?? defaultOption.beforeWriteFile

  // Function to create the dts plugin instance
  const generateTypes = () => {
    return dts({
      outDir,
      include,
      beforeWriteFile,
      declarationOnly: true,
      afterBuild: () => {
        console.log(`✅ Types are regenerated into ${outDir}`)
      }
    })
  }

  return [
    {
      name: 'vite-plugin-typegen-mode-detector',
      config: (_config, { command, mode }) => {
        if (command === 'build' && mode === 'typegen') {
          return {
            build: {
              outDir: 'temp-typegen',
              lib: {
                entry: resolve(process.cwd(), entry),
                name: 'typegen',
                formats: ['es'],
                fileName: () => 'temp.js'
              }
            }
          }
        }
        return {}
      }
    },
    {
      ...generateTypes(),
      enforce: 'post',
      apply: (_, { command, mode }) => {
        return command === 'build' && mode === 'typegen'
      }
    }
  ]
}

export default typegenPlugin
