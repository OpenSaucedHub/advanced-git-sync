import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import { Repository, Config, Branch, BranchFilterOptions } from '../../types'
import { globToRegex } from '@src/utils/repoUtils'
import { GitHub } from '@actions/github/lib/utils'
import { Gitlab } from '@gitbeaker/core'

type PlatformClient = InstanceType<typeof GitHub> | Gitlab
type PlatformType = 'github' | 'gitlab'

export class BranchHelper {
  private repoPath: string | null = null

  constructor(
    private client: PlatformClient,
    private platform: PlatformType,
    private repo: Repository,
    private config: Config,
    private getProjectId?: () => Promise<number>
  ) {}

  private getRepoPathFromConfig(): string | null {
    if (this.config.gitlab?.projectId) {
      return null
    }

    const owner = this.config.gitlab.owner
    const repo = this.config.gitlab.repo

    if (owner && repo) {
      return `${owner}/${repo}`
    }

    return null
  }

  async fetch(filterOptions?: BranchFilterOptions): Promise<Branch[]> {
    if (this.platform === 'github') {
      return this.fetchGitHub(filterOptions)
    } else {
      return this.fetchGitLab(filterOptions)
    }
  }

  private async fetchGitHub(
    filterOptions?: BranchFilterOptions
  ): Promise<Branch[]> {
    const octokit = this.client as InstanceType<typeof GitHub>
    core.info('\x1b[36m🌿 Fetching GitHub Branches...\x1b[0m')

    const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
      ...this.repo
    })

    interface GitHubBranch {
      name: string
      commit: {
        sha: string
      }
      protected: boolean
    }

    let processedBranches: Branch[] = await Promise.all(
      branches.map(async (branch: GitHubBranch) => {
        let lastCommitDate: string | undefined
        try {
          const { data: commit } = await octokit.rest.git.getCommit({
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

    core.info(
      `\x1b[32m✓ Branches Fetched: ${processedBranches.length} branches (${processedBranches.map((branch: Branch) => branch.name).join(', ')})\x1b[0m`
    )
    return processedBranches
  }

  private async fetchGitLab(
    filterOptions?: BranchFilterOptions
  ): Promise<Branch[]> {
    const gitlab = this.client as Gitlab
    core.info('\x1b[36m🌿 Fetching GitLab Branches...\x1b[0m')

    const projectId = await this.getProjectId!()
    const repo = await gitlab.Projects.show(projectId)
    if (repo && repo.path_with_namespace) {
      try {
        const decodedPath = decodeURIComponent(repo.path_with_namespace)
        this.repoPath = decodedPath
        core.debug(`Extracted repo path: ${this.repoPath}`)
      } catch (error) {
        const errMsg = (error && (error as Error).message) || String(error)
        core.warning(
          `Failed to decode repository path 'path_with_namespace'. Falling back to update() repo path resolution. Error: ${errMsg}`
        )
      }
    } else {
      core.debug(
        "GitLab project does not have 'path_with_namespace'; will use fallback repo path resolution in update()"
      )
    }
    const branches = await gitlab.Branches.all(projectId)

    interface GitLabBranch {
      name: string
      commit: { id: string }
      protected: boolean
    }

    let processedBranches: Branch[] = await Promise.all(
      branches.map(async (branch: GitLabBranch) => {
        let lastCommitDate: string | undefined
        try {
          const commit = await gitlab.Commits.show(projectId, branch.commit.id)
          lastCommitDate = commit.created_at
        } catch (error) {
          core.debug(`Failed to get commit date for ${branch.name}: ${error}`)
        }

        return {
          name: branch.name,
          sha: branch.commit.id,
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

    core.info(
      `\x1b[32m✓ Branches Fetched: ${processedBranches.length} branches (${processedBranches.map((branch: Branch) => branch.name).join(', ')})\x1b[0m`
    )
    return processedBranches
  }

  async update(name: string, commitSha: string): Promise<void> {
    if (this.platform === 'github') {
      return this.updateGitHub(name, commitSha)
    } else {
      return this.updateGitLab(name, commitSha)
    }
  }

  private async updateGitHub(name: string, commitSha: string): Promise<void> {
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
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    }
  }

  private async updateGitLab(name: string, commitSha: string): Promise<void> {
    if (!this.repoPath) {
      this.repoPath = this.getRepoPathFromConfig()

      if (!this.repoPath) {
        throw new Error('Could not determine repository path')
      }
    }

    const gitlabUrl = this.config.gitlab.host || 'https://gitlab.com'
    const repoPath = `${gitlabUrl}/${this.repoPath}.git`
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

      const githubUrl = `https://x-access-token:${this.config.github.token}@github.com/${this.config.github.owner}/${this.config.github.repo}.git`
      await exec.exec('git', ['remote', 'add', 'github', githubUrl], {
        cwd: tmpDir
      })

      try {
        await exec.exec('git', ['fetch', 'github', commitSha], { cwd: tmpDir })
      } catch (fetchError) {
        throw new Error(
          `Failed to fetch commit ${commitSha} from GitHub: ${String(fetchError)}`
        )
      }

      const gitlabAuthUrl = `https://oauth2:${this.config.gitlab.token}@${repoPath.replace('https://', '')}`
      await exec.exec('git', ['remote', 'add', 'gitlab', gitlabAuthUrl], {
        cwd: tmpDir
      })

      console.log(`git push -f gitlab ${commitSha}:refs/heads/${name}`)

      try {
        await exec.exec(
          'git',
          ['push', '-f', 'gitlab', `${commitSha}:refs/heads/${name}`],
          { cwd: tmpDir }
        )
      } catch (pushError) {
        const errorStr = String(pushError)
        if (errorStr.includes('workflow') && errorStr.includes('scope')) {
          throw new Error(
            `Failed to push to GitLab: GitHub token lacks 'workflow' scope. Please use a Personal Access Token with workflow scope.`
          )
        }
        throw new Error(`Failed to push branch ${name} to GitLab: ${errorStr}`)
      }
    } catch (error) {
      throw new Error(
        `Failed to update branch ${name} on GitLab: ${String(error)}`
      )
    } finally {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    }
  }

  async create(name: string, commitSha: string): Promise<void> {
    await this.update(name, commitSha)
  }

  async delete(name: string): Promise<void> {
    if (this.platform === 'gitlab') {
      try {
        const gitlab = this.client as Gitlab
        const projectId = await this.getProjectId!()
        await gitlab.Branches.remove(projectId, name)
        core.info(`✓ Deleted branch ${name} from GitLab`)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        throw new Error(
          `Failed to delete branch ${name} from GitLab: ${errorMessage}`
        )
      }
    } else {
      throw new Error('Branch deletion is only supported for GitLab')
    }
  }
}
