import simpleGit, { SimpleGit } from 'simple-git'
import * as core from '@actions/core'
import { SyncConfig } from '../types'

export class GitSync {
  private git: SimpleGit
  private config: SyncConfig

  constructor(config: SyncConfig) {
    this.git = simpleGit()
    this.config = config
  }

  async setupRemote(): Promise<void> {
    const { url, username, token } = this.config.gitlab
    const gitlabUrl = url.replace('https://', `https://${username}:${token}@`)

    await this.git.addRemote('gitlab', gitlabUrl)
  }

  async syncBranch(branchName: string): Promise<void> {
    if (!this.config.sync.branches.enabled) {
      core.info(`Branch sync is disabled for ${branchName}`)
      return
    }

    try {
      await this.git.push(['gitlab', branchName, '--force'])
      core.info(`Successfully synced branch: ${branchName}`)
    } catch (error) {
      if (error instanceof Error) {
        core.error(`Failed to sync branch ${branchName}: ${error.message}`)
      }
      throw error
    }
  }
}
