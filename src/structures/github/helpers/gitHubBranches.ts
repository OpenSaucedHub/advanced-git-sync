import * as core from '@actions/core'
import { Repository, Config, Branch } from '@src/types'

export class githubBranchHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async sync(): Promise<Branch[]> {
    // Check if branch sync is enabled in the configuration
    if (!this.config.gitlab.sync?.branches.enabled) {
      return []
    }

    try {
      // Colorful console log for fetching branches
      core.info('\x1b[36m🌿 Fetching GitHub Branches...\x1b[0m')

      // Remove the protected filter from the initial fetch to get all branches
      const { data: branches } = await this.octokit.rest.repos.listBranches({
        ...this.repo
      })

      // Then filter the branches based on the config
      interface GitHubBranch {
        name: string
        commit: {
          sha: string
        }
        protected: boolean
      }

      const processedBranches: Branch[] = branches
        .filter(
          (branch: GitHubBranch) =>
            this.config.gitlab.sync?.branches.protected || !branch.protected
        )
        .map((branch: GitHubBranch) => ({
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected
        }))

      // Log successful branch fetch
      core.info(
        `\x1b[32m✓ Branches Fetched: ${processedBranches.length} branches\x1b[0m`
      )
      return processedBranches
    } catch (error) {
      // Error handling with colorful console warning
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Branches: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async create(name: string, commitSha: string): Promise<void> {
    try {
      // Create a new branch reference
      await this.octokit.rest.git.createRef({
        ...this.repo,
        ref: `refs/heads/${name}`,
        sha: commitSha
      })
    } catch (error) {
      // Throw a descriptive error if branch creation fails
      throw new Error(
        `Failed to create branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async update(name: string, commitSha: string): Promise<void> {
    try {
      // Update an existing branch reference
      await this.octokit.rest.git.updateRef({
        ...this.repo,
        ref: `refs/heads/${name}`,
        sha: commitSha,
        force: true
      })
    } catch (error) {
      // Throw a descriptive error if branch update fails
      throw new Error(
        `Failed to update branch ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
