import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import { Repository, Config, Branch, BranchFilterOptions } from '@src/types'
import { globToRegex } from '@src/utils/repoUtils'
import { GitHub } from '@actions/github/lib/utils'
export class githubBranchHelper {
  constructor(
    private octokit: InstanceType<typeof GitHub>,
    private repo: Repository,
    private config: Config
  ) {}

  async fetch(filterOptions?: BranchFilterOptions): Promise<Branch[]> {
    // Colorful console log for fetching branches
    core.info('\x1b[36m🌿 Fetching GitHub Branches...\x1b[0m')

    // Fetch all branches
    const branches = await this.octokit.paginate(
      this.octokit.rest.repos.listBranches,
      {
        ...this.repo
      }
    )

    interface GitHubBranch {
      name: string
      commit: {
        sha: string
      }
      protected: boolean
    }

    // Map branches to an internal format with commit timestamps
    let processedBranches: Branch[] = await Promise.all(
      branches.map(async (branch: GitHubBranch) => {
        // Get commit details for timestamp
        let lastCommitDate: string | undefined
        try {
          const { data: commit } = await this.octokit.rest.git.getCommit({
            ...this.repo,
            commit_sha: branch.commit.sha
          })
          lastCommitDate = commit.author.date
        } catch (error) {
          core.debug(`Failed to get commit date for ${branch.name}: ${error}`)
        }

        return {
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected,
          lastCommitDate
        }
      })
    )

    if (filterOptions) {
      if (filterOptions.includeProtected === false) {
        processedBranches = processedBranches.filter(
          branch => !branch.protected
        )
      }
      if (filterOptions.pattern) {
        const regex = globToRegex(filterOptions.pattern)
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
    const tmpDir = path.join(
      process.cwd(),
      `.tmp-git-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    )

    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      await exec.exec('git', ['init', '--initial-branch=sync-main'], {
        cwd: tmpDir
      })
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

      // Fetch the specific commit from GitLab with error handling
      try {
        await exec.exec('git', ['fetch', 'gitlab', commitSha], { cwd: tmpDir })
      } catch (fetchError) {
        throw new Error(
          `Failed to fetch commit ${commitSha} from GitLab: ${String(fetchError)}`
        )
      }

      const githubAuthUrl = `https://x-access-token:${this.config.github.token}@github.com/${this.config.github.owner}/${this.config.github.repo}.git`
      await exec.exec('git', ['remote', 'add', 'github', githubAuthUrl], {
        cwd: tmpDir
      })

      // Push to GitHub with better error handling
      try {
        await exec.exec(
          'git',
          ['push', '-f', 'github', `${commitSha}:refs/heads/${name}`],
          { cwd: tmpDir }
        )
      } catch (pushError) {
        const errorStr = String(pushError)
        if (errorStr.includes('workflow') && errorStr.includes('scope')) {
          throw new Error(
            `Failed to push to GitHub: Token lacks 'workflow' scope. Please use a Personal Access Token with workflow scope instead of GITHUB_TOKEN.`
          )
        }
        throw new Error(`Failed to push branch ${name} to GitHub: ${errorStr}`)
      }
    } catch (error) {
      throw new Error(
        `Failed to update branch ${name} on GitHub: ${String(error)}`
      )
    } finally {
      // Always cleanup temp directory
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    }
  }

  async create(name: string, commitSha: string): Promise<void> {
    await this.update(name, commitSha)
  }
}
