import { Branch, Config, Repository } from '@/src/types'
import * as core from '@actions/core'

export class BranchHelper {
  constructor(
    private gitlab: any,
    private config: Config,
    private getProjectId: () => Promise<number>
  ) {}

  async sync(): Promise<Branch[]> {
    if (!this.config.github.sync?.branches.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🌿 Fetching GitLab Branches...\x1b[0m')

      // Get identifier - either project ID or path
      const projectId = await this.getProjectId()

      const branches = await this.gitlab.Branches.all(projectId)

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
      const projectId = await this.getProjectId()
      await this.gitlab.Branches.create(projectId, name, commitSha)
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
      const projectId = await this.getProjectId()
      await this.gitlab.Branches.remove(projectId, name)
      await this.gitlab.Branches.create(projectId, name, commitSha)
    } catch (error) {
      throw new Error(
        `Failed to update branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
