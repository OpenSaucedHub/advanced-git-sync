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

    // Log the start of GitHub token validation
    core.startGroup('🔍 GitHub Token Validation')
    core.info(
      `\x1b[36mValidating GitHub token for repository: ${repo.owner}/${repo.repo}\x1b[0m`
    )

    // Check repository access
    try {
      await octokit.rest.repos.get({ ...repo })
      core.info(`\x1b[32m✓ Repository access verified successfully\x1b[0m`)
    } catch (error) {
      result.isValid = false
      const errorMessage = `Repository access verification failed: ${error instanceof Error ? error.message : String(error)}`
      core.error(`\x1b[31m✗ ${errorMessage}\x1b[0m`)
      result.errors.push(
        `EVLD: GitHub token lacks repository access permissions: ${errorMessage}`
      )
      core.endGroup()
      return result
    }

    // Check specific permissions based on sync configuration
    const permissionChecks = [
      {
        feature: 'issues',
        check: async () => await octokit.rest.issues.listForRepo({ ...repo }),
        warningMessage: 'GitHub token lacks issues read/write permissions'
      },
      {
        feature: 'pullRequests',
        check: async () => await octokit.rest.pulls.list({ ...repo }),
        warningMessage:
          'GitHub token lacks pull requests read/write permissions'
      },
      {
        feature: 'releases',
        check: async () => await octokit.rest.repos.listReleases({ ...repo }),
        warningMessage: 'GitHub token lacks releases read/write permissions'
      }
    ]

    for (const check of permissionChecks) {
      if (
        config.github.sync?.[check.feature as keyof typeof config.github.sync]
          ?.enabled
      ) {
        try {
          await check.check()
          core.info(`\x1b[32m✓ ${check.feature} permissions verified\x1b[0m`)
        } catch {
          core.warning(`\x1b[33m⚠ ${check.warningMessage}\x1b[0m`)
          result.warnings.push(`EVLD: ${check.warningMessage}`)
        }
      }
    }

    core.endGroup()
    core.info('\x1b[32m✓ GitHub Token Validation Completed Successfully\x1b[0m')

    return result
  } catch (error) {
    core.endGroup()
    core.error(`\x1b[31m✗ Invalid GitHub token\x1b[0m`)
    result.isValid = false
    result.errors.push(
      `EVLD: Invalid GitHub token: ${error instanceof Error ? error.message : String(error)}`
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

    // Properly encode the project path
    const projectPath = encodeURIComponent(`${repo.owner}/${repo.repo}`)

    // Log the start of GitLab token validation
    core.startGroup('🔍 GitLab Token Validation')
    core.info(
      `\x1b[36mValidating GitLab token for repository: ${repo.owner}/${repo.repo}\x1b[0m`
    )

    // Check repository access
    try {
      await gitlab.Projects.show(projectPath)
      core.info(`\x1b[32m✓ Repository access verified successfully\x1b[0m`)
    } catch (error) {
      result.isValid = false
      const errorMessage = `Repository access verification failed: ${error instanceof Error ? error.message : String(error)}`
      core.error(`\x1b[31m✗ ${errorMessage}\x1b[0m`)
      result.errors.push(
        `EVLD: GitLab token lacks repository access permissions: ${errorMessage}`
      )
      core.endGroup()
      return result
    }

    // Check specific permissions based on sync configuration
    const permissionChecks = [
      {
        feature: 'issues',
        check: async () =>
          await gitlab.Issues.all({ projectId: projectPath, perPage: 1 }),
        warningMessage: 'GitLab token lacks issues read/write permissions'
      },
      {
        feature: 'pullRequests',
        check: async () =>
          await gitlab.MergeRequests.all({
            projectId: projectPath,
            perPage: 1
          }),
        warningMessage:
          'GitLab token lacks merge requests read/write permissions'
      },
      {
        feature: 'releases',
        check: async () => await gitlab.ProjectReleases.all(projectPath),
        warningMessage: 'GitLab token lacks releases read/write permissions'
      }
    ]

    for (const check of permissionChecks) {
      if (
        config.gitlab.sync?.[check.feature as keyof typeof config.gitlab.sync]
          ?.enabled
      ) {
        try {
          await check.check()
          core.info(`\x1b[32m✓ ${check.feature} permissions verified\x1b[0m`)
        } catch {
          core.warning(`\x1b[33m⚠ ${check.warningMessage}\x1b[0m`)
          result.warnings.push(`EVLD: ${check.warningMessage}`)
        }
      }
    }

    core.info('\x1b[32m✓ GitLab Token Validation Completed Successfully\x1b[0m')
    core.endGroup()
    return result
  } catch (error) {
    core.error(`\x1b[31m✗ Invalid GitLab token\x1b[0m`)
    core.endGroup()
    result.isValid = false
    result.errors.push(
      `EVLD: Invalid GitLab token: ${error instanceof Error ? error.message : String(error)}`
    )
    return result
  }
}

/**
 * Validates both GitHub and GitLab tokens based on the configuration
 */
export async function validateTokens(config: Config): Promise<void> {
  let hasErrors = false

  // Validate GitHub token if GitHub sync is enabled
  if (config.github.enabled) {
    core.info('\x1b[34mValidating GitHub Token\x1b[0m')
    if (!config.github.token) {
      core.error(
        '\x1b[31m✗ GitHub token is required when GitHub sync is enabled\x1b[0m'
      )
      hasErrors = true
    } else {
      const githubResult = await validateGitHubToken(
        config.github.token,
        config
      )

      if (!githubResult.isValid) {
        githubResult.errors.forEach(error =>
          core.error(`\x1b[31m✗ GitHub: ${error}\x1b[0m`)
        )
        hasErrors = true
      }

      githubResult.warnings.forEach(warning =>
        core.warning(`\x1b[33m⚠ GitHub: ${warning}\x1b[0m`)
      )
    }
  }

  // Validate GitLab token if GitLab sync is enabled
  if (config.gitlab.enabled) {
    core.info('\x1b[34mValidating GitLab Token\x1b[0m')
    if (!config.gitlab.token) {
      core.error(
        '\x1b[31m✗ GitLab token is required when GitLab sync is enabled\x1b[0m'
      )
      hasErrors = true
    } else {
      const gitlabResult = await validateGitLabToken(
        config.gitlab.token,
        config
      )

      if (!gitlabResult.isValid) {
        gitlabResult.errors.forEach(error =>
          core.error(`\x1b[31m✗ GitLab: ${error}\x1b[0m`)
        )
        hasErrors = true
      }

      gitlabResult.warnings.forEach(warning =>
        core.warning(`\x1b[33m⚠ GitLab: ${warning}\x1b[0m`)
      )
    }
  }

  if (hasErrors) {
    core.setFailed('Token validation failed')
    throw new Error(
      'EVLD: Token validation failed. Please check the logs for details.'
    )
  } else {
    core.info('\x1b[32m✓ All tokens validated successfully!\x1b[0m')
  }
}

/**
 * Validates and adjusts sync configuration settings
 * Ensures proper relationship between releases and tags
 */
export function validateSyncConfig(config: Config): Config {
  // Check GitLab sync configuration
  if (config.gitlab?.enabled && config.gitlab.sync) {
    if (
      config.gitlab.sync.releases?.enabled &&
      !config.gitlab.sync.tags?.enabled
    ) {
      core.warning(
        '\x1b[33m⚠️ GitLab tags sync was automatically enabled because releases sync is enabled. This prevents release-tag orphaning.\x1b[0m'
      )
      config.gitlab.sync.tags = {
        ...config.gitlab.sync.tags,
        enabled: true
      }
    }
  }

  // Check GitHub sync configuration
  if (config.github?.enabled && config.github.sync) {
    if (
      config.github.sync.releases?.enabled &&
      !config.github.sync.tags?.enabled
    ) {
      core.warning(
        '\x1b[33m⚠️ GitHub tags sync was automatically enabled because releases sync is enabled. This prevents release-tag orphaning.\x1b[0m'
      )
      config.github.sync.tags = {
        ...config.github.sync.tags,
        enabled: true
      }
    }
  }

  return config
}
