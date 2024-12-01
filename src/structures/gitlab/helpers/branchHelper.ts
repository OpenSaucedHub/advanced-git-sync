import { Branch, Config, Repository } from '@/src/types'
import * as core from '@actions/core'

export class BranchHelper {
  constructor(
    private gitlab: any,
    private repo: Repository,
    private config: Config
  ) {}

  private get projectPath(): string {
    return encodeURIComponent(`${this.repo.owner}/${this.repo.repo}`)
  }

  async sync(): Promise<Branch[]> {
    if (!this.config.github.sync?.branches.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🌿 Fetching GitLab Branches...\x1b[0m')

      const branches = await this.gitlab.Branches.all(this.projectPath)
      const processedBranches = branches.map(
        (branch: {
          name: string
          commit: { id: string }
          protected: boolean
        }) => ({
          name: branch.name,
          sha: branch.commit.id,
          protected: branch.protected
        })
      )

      core.info(
        `\x1b[32m✓ Branches Fetched: ${processedBranches.length} branches\x1b[0m`
      )
      return processedBranches
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab Branches: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async create(name: string, commitSha: string): Promise<void> {
    try {
      await this.gitlab.Branches.create(this.projectPath, name, commitSha)
    } catch (error) {
      throw new Error(
        `Failed to create branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async update(name: string, commitSha: string): Promise<void> {
    try {
      await this.gitlab.Branches.remove(this.projectPath, name)
      await this.gitlab.Branches.create(this.projectPath, name, commitSha)
    } catch (error) {
      throw new Error(
        `Failed to update branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
