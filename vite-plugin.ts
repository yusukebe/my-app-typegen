import { Plugin } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'
import { watch } from 'node:fs'
import { exec } from 'node:child_process'

interface TypegenOptions {
  entry?: string
  outDir?: string
  include?: string[]
  watchDirs?: string[]
  enableWatch?: boolean
  beforeWriteFile?: (filePath: string) => { filePath: string } | undefined
}

const defaultOption: Required<TypegenOptions> = {
  entry: 'src/index.ts',
  outDir: '.hono/types/src',
  include: ['./src/**/*.ts', './src/**/*.tsx'],
  watchDirs: ['./src'],
  enableWatch: true,
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
  const watchDirs = options.watchDirs ?? defaultOption.watchDirs
  const enableWatch = options.enableWatch ?? defaultOption.enableWatch
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
        if ((command === 'build' && mode === 'typegen') || (command === 'serve' && enableWatch)) {
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
      },
      configureServer(server) {
        if (!enableWatch) return

        let timeout: NodeJS.Timeout | null = null
        const debounceTime = 500 // milliseconds

        // Function to execute the typegen build command
        const runTypegen = () => {
          console.log('🔄 Types are being regenerated...')
          exec('vite build --mode typegen', (error, _stdout, stderr) => {
            if (error) {
              console.error(`❌ Type generation error: ${error.message}`)
              return
            }
            if (stderr) {
              console.error(`❌ Type generation stderr: ${stderr}`)
              return
            }
            console.log(`✅ Types regenerated successfully`)
          })
        }

        // Set up a watcher for a specific directory
        const setupWatcher = (dir: string) => {
          try {
            const watcher = watch(dir, { recursive: true }, (_eventType, filename) => {
              if (!filename || !filename.endsWith('.ts')) return

              // Debounce to prevent multiple consecutive builds
              if (timeout) {
                clearTimeout(timeout)
              }

              timeout = setTimeout(() => {
                console.log(`📁 Detected changes in ${filename}`)
                runTypegen()
                timeout = null
              }, debounceTime)
            })

            // Clean up watcher when server closes
            server.httpServer?.on('close', () => {
              watcher.close()
            })

            console.log(`👀 Watching ${dir} for TypeScript changes...`)
          } catch (err) {
            console.error(`❌ Error setting up watcher for ${dir}:`, err)
          }
        }

        // Set up watchers for all directories
        watchDirs.forEach((dir) => {
          setupWatcher(resolve(process.cwd(), dir))
        })

        // Initial type generation
        console.log('🚀 Initial type generation in dev mode...')
        runTypegen()
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
