import fs from 'fs'
import * as core from '@actions/core'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

async function cleanup(): Promise<void> {
  try {
    // 1. Restore original files
    const filesToRestore = [
      { backup: 'package.json.original-backup', original: 'package.json' },
      { backup: 'bun.lock.original-backup', original: 'bun.lock' }
    ]

    for (const file of filesToRestore) {
      if (fs.existsSync(file.backup)) {
        fs.renameSync(file.backup, file.original)
        console.log(`Restored ${file.original}`)
      } else if (fs.existsSync(file.original)) {
        fs.unlinkSync(file.original)
        console.log(`Removed ${file.original}`)
      }
    }

    // 2. Clear Bun cache
    try {
      await execPromise('bun pm cache rm')
      console.log('Cleared Bun cache')
    } catch (error) {
      console.warn('Warning: Failed to clear Bun cache:', error)
    }

    // 3. Reset git changes if any were made
    const resetCommands = ['git reset --hard HEAD', 'git clean -fd']

    for (const cmd of resetCommands) {
      try {
        await execPromise(cmd)
        console.log(`Executed: ${cmd}`)
      } catch (error) {
        console.warn(`Warning: Failed to execute ${cmd}:`, error)
      }
    }

    console.log('Cleanup completed successfully')
  } catch (error) {
    core.setFailed(`Cleanup failed: ${(error as Error).message}`)
  }
}

cleanup()
