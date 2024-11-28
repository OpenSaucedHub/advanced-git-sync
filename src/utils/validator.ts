// src/utils/validator.ts
import * as core from '@actions/core'
import { Gitlab } from '@gitbeaker/rest'
import * as github from '@actions/github'
import { Config } from '../types'
import { getGitHubRepo, getGitLabRepo } from './repository'

interface TokenValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates GitHub token permissions
 */
async function validateGitHubToken(
  token: string,
  config: Config
): Promise<TokenValidationResult> {
  const result: TokenValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  }

  try {
    const octokit = github.getOctokit(token)
    const repo = getGitHubRepo(config)

    // Check repository access
    try {
      await octokit.rest.repos.get({ ...repo })
    } catch (error) {
      result.isValid = false
      result.errors.push(
        `EVALID: GitHub token lacks repository access permissions: ${error instanceof Error ? error.message : String(error)}`
      )
      return result
    }

    // Check specific permissions based on sync configuration
    if (config.github.sync?.issues.enabled) {
      try {
        await octokit.rest.issues.listForRepo({ ...repo })
      } catch {
        result.warnings.push(
          'EVALID: GitHub token lacks issues read/write permissions'
        )
      }
    }

    if (config.github.sync?.pullRequests.enabled) {
      try {
        await octokit.rest.pulls.list({ ...repo })
      } catch {
        result.warnings.push(
          'EVALID: GitHub token lacks pull requests read/write permissions'
        )
      }
    }

    if (config.github.sync?.releases.enabled) {
      try {
        await octokit.rest.repos.listReleases({ ...repo })
      } catch {
        result.warnings.push(
          'EVALID: GitHub token lacks releases read/write permissions'
        )
      }
    }

    return result
  } catch (error) {
    result.isValid = false
    result.errors.push(
      `EVALID: Invalid GitHub token: ${error instanceof Error ? error.message : String(error)}`
    )
    return result
  }
}

/**
 * Validates GitLab token permissions
 */
async function validateGitLabToken(
  token: string,
  config: Config
): Promise<TokenValidationResult> {
  const result: TokenValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  }

  try {
    const gitlab = new Gitlab({
      token,
      host: config.gitlab.url || 'https://gitlab.com'
    })
    const repo = getGitLabRepo(config)
    const projectPath = `${repo.owner}/${repo.repo}`

    // Check repository access
    try {
      await gitlab.Projects.show(projectPath)
    } catch (error) {
      result.isValid = false
      result.errors.push(
        `EVALID: GitLab token lacks repository access permissions: ${error instanceof Error ? error.message : String(error)}`
      )
      return result
    }

    // Check specific permissions based on sync configuration
    if (config.gitlab.sync?.issues.enabled) {
      try {
        await gitlab.Issues.all({ projectId: projectPath, perPage: 1 })
      } catch {
        result.warnings.push(
          'EVALID: GitLab token lacks issues read/write permissions'
        )
      }
    }

    if (config.gitlab.sync?.pullRequests.enabled) {
      try {
        await gitlab.MergeRequests.all({ projectId: projectPath, perPage: 1 })
      } catch {
        result.warnings.push(
          'EVALID: GitLab token lacks merge requests read/write permissions'
        )
      }
    }

    if (config.gitlab.sync?.releases.enabled) {
      try {
        await gitlab.ProjectReleases.all(projectPath)
      } catch {
        result.warnings.push(
          'EVALID: GitLab token lacks releases read/write permissions'
        )
      }
    }

    return result
  } catch (error) {
    result.isValid = false
    result.errors.push(
      `EVALID: Invalid GitLab token: ${error instanceof Error ? error.message : String(error)}`
    )
    return result
  }
}

/**
 * Validates both GitHub and GitLab tokens based on the configuration
 */
export async function validateTokens(config: Config): Promise<void> {
  core.startGroup('Token Validation')

  try {
    let hasErrors = false

    // Validate GitHub token if GitHub sync is enabled
    if (config.github.enabled) {
      if (!config.github.token) {
        core.error(
          'EVALID: GitHub token is required when GitHub sync is enabled'
        )
        hasErrors = true
      } else {
        const githubResult = await validateGitHubToken(
          config.github.token,
          config
        )

        if (!githubResult.isValid) {
          githubResult.errors.forEach(error => core.error(`GitHub: ${error}`))
          hasErrors = true
        }

        githubResult.warnings.forEach(warning =>
          core.warning(`GitHub: ${warning}`)
        )
      }
    }

    // Validate GitLab token if GitLab sync is enabled
    if (config.gitlab.enabled) {
      if (!config.gitlab.token) {
        core.error(
          'EVALID: GitLab token is required when GitLab sync is enabled'
        )
        hasErrors = true
      } else {
        const gitlabResult = await validateGitLabToken(
          config.gitlab.token,
          config
        )

        if (!gitlabResult.isValid) {
          gitlabResult.errors.forEach(error => core.error(`GitLab: ${error}`))
          hasErrors = true
        }

        gitlabResult.warnings.forEach(warning =>
          core.warning(`GitLab: ${warning}`)
        )
      }
    }

    if (hasErrors) {
      throw new Error(
        'EVALID: Token validation failed. Please check the logs for details.'
      )
    }
  } finally {
    core.endGroup()
  }
}
