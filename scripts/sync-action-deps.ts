#!/usr/bin/env node

/**
 * Sync action.yml dependencies with package.json versions
 * This script ensures that the dependency versions in action.yml match those in package.json
 */

import fs from 'fs'
import path from 'path'

const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json')
const ACTION_YML_PATH = path.join(__dirname, '..', 'action.yml')

// Dependencies that need to be synced between package.json and action.yml
const SYNC_DEPENDENCIES = [
  '@actions/core',
  '@actions/github',
  '@gitbeaker/rest',
  '@octokit/rest',
  'deepmerge',
  'js-yaml',
  'zod'
]

interface ChangeRecord {
  dep: string
  from: string
  to: string
}

function main(): void {
  console.log('🔄 Syncing action.yml dependencies with package.json...\n')

  // Read package.json
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error('❌ package.json not found')
    process.exit(1)
  }

  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'))
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }

  // Read action.yml
  if (!fs.existsSync(ACTION_YML_PATH)) {
    console.error('❌ action.yml not found')
    process.exit(1)
  }

  let actionYml = fs.readFileSync(ACTION_YML_PATH, 'utf8')

  // Track changes
  let hasChanges = false
  const changes: ChangeRecord[] = []

  // Sync each dependency
  for (const dep of SYNC_DEPENDENCIES) {
    const packageVersion = dependencies[dep]
    if (!packageVersion) {
      console.warn(`⚠️  ${dep} not found in package.json`)
      continue
    }

    // Create regex to find the dependency in action.yml
    const depRegex = new RegExp(
      `"${dep.replace('/', '\\/')}":\\s*"([^"]*)"`,
      'g'
    )
    const match = depRegex.exec(actionYml)

    if (match) {
      const currentVersion = match[1]
      const newVersion = packageVersion

      if (currentVersion !== newVersion) {
        console.log(`📦 ${dep}: ${currentVersion} → ${newVersion}`)
        actionYml = actionYml.replace(
          `"${dep}": "${currentVersion}"`,
          `"${dep}": "${newVersion}"`
        )
        hasChanges = true
        changes.push({ dep, from: currentVersion, to: newVersion })
      } else {
        console.log(`✅ ${dep}: ${currentVersion} (already in sync)`)
      }
    } else {
      console.warn(`⚠️  ${dep} not found in action.yml`)
    }
  }

  if (hasChanges) {
    // Write updated action.yml
    fs.writeFileSync(ACTION_YML_PATH, actionYml)
    console.log(
      `\n✅ Updated action.yml with ${changes.length} dependency changes`
    )

    // Output for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changes=true\n')

      // Create a summary of changes
      const changesSummary = changes
        .map(c => `- ${c.dep}: ${c.from} → ${c.to}`)
        .join('\n')

      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `changes-summary<<EOF\n${changesSummary}\nEOF\n`
      )
    }

    process.exit(0)
  } else {
    console.log('\n✅ All dependencies are already in sync')

    // Output for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changes=false\n')
    }

    process.exit(0)
  }
}

// Handle errors
process.on('uncaughtException', error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', error => {
  console.error('❌ Error:', (error as Error).message)
  process.exit(1)
})

main()
