// src/utils/repository.ts
import * as github from '@actions/github'
import { Repository, Config } from '../../types'

/**
 * Convert glob pattern to regex pattern
 * Handles common glob patterns used for branch matching
 */
export function globToRegex(pattern: string): RegExp {
  // Handle special case for "*" - match everything
  if (pattern === '*') {
    return /^.*$/
  }

  // Escape special regex characters except * and ?
  let regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace(/\*/g, '.*') // Convert * to .*
    .replace(/\?/g, '.') // Convert ? to .

  // Ensure the pattern matches the entire string
  if (!regexPattern.startsWith('^')) {
    regexPattern = '^' + regexPattern
  }
  if (!regexPattern.endsWith('$')) {
    regexPattern = regexPattern + '$'
  }

  return new RegExp(regexPattern)
}

export function getGitHubRepo(config: Config): Repository {
  const context = github.context
  return {
    owner: config.github.owner || context.repo.owner,
    repo: config.github.repo || context.repo.repo
  }
}

export function getGitLabRepo(config: Config): Repository {
  const context = github.context

  // Return empty repository if projectId is provided
  if (config.gitlab?.projectId) {
    return { owner: '', repo: '' }
  }

  // Otherwise use owner/repo
  return {
    owner: config.gitlab.owner || context.repo.owner,
    repo: config.gitlab.repo || context.repo.repo
  }
}
