const fs = require('fs')
const core = require('@actions/core')
const { exec } = require('child_process')

async function cleanup() {
  try {
    // 1. Restore original files
    const filesToRestore = [
      { backup: 'package.json.original-backup', original: 'package.json' },
      { backup: 'bun.lockb.original-backup', original: 'bun.lockb' }
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
    await new Promise((resolve, reject) => {
      exec('bun pm cache rm', error => {
        if (error) {
          console.warn('Warning: Failed to clear Bun cache:', error)
        } else {
          console.log('Cleared Bun cache')
        }
        resolve()
      })
    })

    // 3. Reset git changes if any were made
    const resetCommands = ['git reset --hard HEAD', 'git clean -fd']

    for (const cmd of resetCommands) {
      await new Promise((resolve, reject) => {
        exec(cmd, error => {
          if (error) {
            console.warn(`Warning: Failed to execute ${cmd}:`, error)
          } else {
            console.log(`Executed: ${cmd}`)
          }
          resolve()
        })
      })
    }

    console.log('Cleanup completed successfully')
  } catch (error) {
    core.setFailed(`Cleanup failed: ${error.message}`)
  }
}

cleanup()
