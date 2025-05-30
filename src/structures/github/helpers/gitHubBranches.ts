import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import { Repository, Config, Branch, BranchFilterOptions } from '@src/types'

export class githubBranchHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async fetch(filterOptions?: BranchFilterOptions): Promise<Branch[]> {
    // Colorful console log for fetching branches
    core.info('\x1b[36m🌿 Fetching GitHub Branches...\x1b[0m')

    // Fetch all branches
    const { data: branches } = await this.octokit.rest.repos.listBranches({
      ...this.repo
    })

    interface GitHubBranch {
      name: string
      commit: {
        sha: string
      }
      protected: boolean
    }

    // Map branches to our internal format
    let processedBranches: Branch[] = branches.map((branch: GitHubBranch) => ({
      name: branch.name,
      sha: branch.commit.sha,
      protected: branch.protected
    }))

    if (filterOptions) {
      if (filterOptions.includeProtected === false) {
        processedBranches = processedBranches.filter(
          branch => !branch.protected
        )
      }
      if (filterOptions.pattern) {
        const regex = new RegExp(filterOptions.pattern)
        processedBranches = processedBranches.filter(branch =>
          regex.test(branch.name)
        )
        core.info(
          `\x1b[36m🔍 Filtering branches with pattern: ${filterOptions.pattern}\x1b[0m`
        )
      }
    }

    // Log successful branch fetch
    core.info(
      `\x1b[32m✓ Branches Fetched: ${processedBranches.length} branches (${processedBranches.map((branch: Branch) => branch.name).join(', ')})\x1b[0m`
    )
    return processedBranches
  }

  async update(name: string, commitSha: string): Promise<void> {
    try {
      const tmpDir = path.join(process.cwd(), '.tmp-git')
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      await exec.exec('git', ['init'], { cwd: tmpDir })
      await exec.exec('git', ['config', 'user.name', 'advanced-git-sync'], {
        cwd: tmpDir
      })
      await exec.exec(
        'git',
        ['config', 'user.email', 'advanced-git-sync@users.noreply.github.com'],
        { cwd: tmpDir }
      )

      const gitlabUrl = this.config.gitlab.host || 'https://gitlab.com'
      const gitlabRepoPath = this.config.gitlab.projectId
        ? `${gitlabUrl}/api/v4/projects/${this.config.gitlab.projectId}`
        : `${gitlabUrl}/${this.config.gitlab.owner}/${this.config.gitlab.repo}.git`

      await exec.exec('git', ['remote', 'add', 'gitlab', gitlabRepoPath], {
        cwd: tmpDir
      })

      await exec.exec('git', ['fetch', 'gitlab', commitSha], { cwd: tmpDir })

      const githubAuthUrl = `https://x-access-token:${this.config.github.token}@github.com/${this.config.github.owner}/${this.config.github.repo}.git`
      await exec.exec('git', ['remote', 'add', 'github', githubAuthUrl], {
        cwd: tmpDir
      })

      await exec.exec(
        'git',
        ['push', '-f', 'github', `${commitSha}:refs/heads/${name}`],
        { cwd: tmpDir }
      )

      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch (error) {
      throw new Error(
        `Failed to update branch ${name} on GitHub: ${String(error)}`
      )
    }
  }

  async create(name: string, commitSha: string): Promise<void> {
    await this.update(name, commitSha)
  }
}
