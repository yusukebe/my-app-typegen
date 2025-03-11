import { Plugin } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

interface TypegenOptions {
  entry?: string
  outDir?: string
  include?: string[]
  beforeWriteFile?: (filePath: string) => { filePath: string } | undefined
}

const defaultOption: Required<TypegenOptions> = {
  entry: 'src/index.ts',
  outDir: '.hono/types/src',
  include: ['./src/**/*.ts', './src/**/*.tsx'],
  beforeWriteFile: (filePath: string) => {
    const newPath = filePath.replace(/(^\/.+\/)([^/]+\.d\.ts)$/, '$1+types/$2')
    return { filePath: newPath }
  }
}

export function typegenPlugin(options: TypegenOptions): Plugin[] {
  const entry = options.entry ?? defaultOption.entry
  const outDir = options.outDir ?? defaultOption.outDir
  const include = options.include ?? defaultOption.include
  const beforeWriteFile = options.beforeWriteFile ?? defaultOption.beforeWriteFile

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
      ...dts({
        outDir,
        include,
        beforeWriteFile,
        declarationOnly: true,
        afterBuild: () => {
          console.log(`✔️ Types are generated into ${outDir}`)
        }
      }),
      enforce: 'post',
      apply: (_, { command, mode }) => command === 'build' && mode === 'typegen'
    }
  ]
}

export default typegenPlugin
