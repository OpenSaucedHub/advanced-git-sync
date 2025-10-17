#!/usr/bin/env node

/**
 * Local Development Test Script for Advanced Git Sync
 * This script sets up the environment for local testing
 */

import fs from 'fs'
import path from 'path'

function setupLocalEnvironment(): boolean {
  console.log('🔧 Setting up local development environment...\n')

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env')
  const envExamplePath = path.join(process.cwd(), '.env.example')

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('📋 Creating .env file from .env.example...')
      fs.copyFileSync(envExamplePath, envPath)
      console.log(
        '✅ .env file created! Please edit it with your actual tokens.\n'
      )
    } else {
      console.log('❌ .env.example file not found. Please create it first.\n')
      process.exit(1)
    }
  } else {
    console.log('✅ .env file already exists\n')
  }

  // Check if local config exists
  const localConfigPath = path.join(process.cwd(), 'sync-config.local.yml')
  if (!fs.existsSync(localConfigPath)) {
    console.log('⚠️  Local config file (sync-config.local.yml) not found.')
    console.log(
      '   You can create one or use the default .github/sync-config.yml\n'
    )
  } else {
    console.log('✅ Local config file found: sync-config.local.yml\n')
  }

  // Set up GitHub Actions simulation environment variables
  console.log('🎭 Setting up GitHub Actions simulation...')

  // Simulate GitHub context - use values from .env if available
  if (!process.env.GITHUB_REPOSITORY) {
    const owner = process.env.GITHUB_OWNER || 'iamvikshan'
    const repo = process.env.GITHUB_REPO || 'devcontainers'
    process.env.GITHUB_REPOSITORY = `${owner}/${repo}`
  }
  if (!process.env.GITHUB_REF) {
    process.env.GITHUB_REF = 'refs/heads/main'
  }
  if (!process.env.GITHUB_SHA) {
    process.env.GITHUB_SHA = 'local-development-' + Date.now()
  }

  // Set config path for local testing
  if (!process.env.INPUT_CONFIG_PATH) {
    if (fs.existsSync(localConfigPath)) {
      process.env.INPUT_CONFIG_PATH = 'sync-config.local.yml'
      console.log('📝 Using local config: sync-config.local.yml')
    } else {
      process.env.INPUT_CONFIG_PATH = '.github/sync-config.yml'
      console.log('📝 Using default config: .github/sync-config.yml')
    }
  }

  console.log('\n🚀 Environment setup complete!')
  console.log('\n📋 Current configuration:')
  console.log(`   Repository: ${process.env.GITHUB_REPOSITORY}`)
  console.log(`   Config Path: ${process.env.INPUT_CONFIG_PATH}`)
  console.log(
    `   GitHub Token: ${process.env.GITHUB_TOKEN ? '✅ Set' : '❌ Not set'}`
  )
  console.log(
    `   GitLab Token: ${process.env.GITLAB_TOKEN ? '✅ Set' : '❌ Not set'}`
  )

  if (!process.env.GITHUB_TOKEN || !process.env.GITLAB_TOKEN) {
    console.log(
      '\n⚠️  Please set your tokens in the .env file before running the sync!'
    )
    console.log('   Edit .env and add your actual token values.')
    return false
  }

  return true
}

function main(): void {
  console.log('🔄 Advanced Git Sync - Local Development Setup\n')

  const isReady = setupLocalEnvironment()

  if (isReady) {
    console.log('\n✅ Ready to run local sync!')
    console.log('\nTo start the sync, run:')
    console.log('   bun s')
    console.log('\nOr with npm:')
    console.log('   npm run s')
    console.log('\n💡 Tips:')
    console.log('   - Edit sync-config.local.yml to customize sync settings')
    console.log(
      '   - Set specific sync operations to false to test individual features'
    )
    console.log('   - Check the logs for detailed sync information')
  } else {
    console.log(
      '\n❌ Setup incomplete. Please fix the issues above and try again.'
    )
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { setupLocalEnvironment }
