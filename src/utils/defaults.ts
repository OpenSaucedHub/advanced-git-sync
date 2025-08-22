// src/utils/defaults.ts
import { Config } from '../types'

/**
 * Default bot branch patterns used when config.botBranches.patterns is empty
 */
export const botDefaults = [
  'dependabot/*', // Dependabot branches
  'renovate/*', // Renovate branches
  'copilot/*', // GitHub Copilot branches
  'feature/*', // Feature branches
  'fix/*', // Fix branches
  'hotfix/*', // Hotfix branches
  'bugfix/*', // Bugfix branches
  'chore/*', // Chore branches
  'docs/*', // Documentation branches
  'refactor/*', // Refactor branches
  'test/*', // Test branches
  'ci/*', // CI branches
  'build/*', // Build branches
  'perf/*', // Performance branches
  'style/*', // Style branches
  'revert-*', // Revert branches
  'temp-*', // Temporary branches
  'wip-*', // Work in progress branches
  'draft-*', // Draft branches
  '^\\d+-*', // Issue number branches (123-fix-bug)
  '^[a-zA-Z]+-\\d+' // Ticket branches (JIRA-123, etc.)
]

/**
 * Protected branches that should never be considered bot branches
 */
export const protectedBranches = [
  'main',
  'master',
  'develop',
  'development',
  'staging',
  'production',
  'release'
]

/**
 * Returns the default configuration with logical priority-based defaults:
 *
 * PRIORITY LEVELS:
 * - CRITICAL (true): branches + historySync - foundation for everything
 * - HIGH (true): tags, releases - core sync features most users want
 * - MEDIUM (false): pullRequests, issues - can be noisy, user preference
 * - LOW (false): comments - very noisy, advanced feature
 *
 * LOGICAL DEPENDENCIES:
 * - releases enabled → tags auto-enabled (handled in validator)
 * - tags/releases enabled → historySync auto-enabled (handled in validator)
 * - pullRequests/issues enabled → branches auto-enabled (handled in validator)
 */
export function getDefaultConfig(): Config {
  return {
    github: {
      enabled: true,
      createIfNotExists: false,
      sync: {
        // CRITICAL: Foundation for all sync operations
        branches: {
          enabled: true,
          protected: true,
          pattern: '*',
          historySync: {
            enabled: true, // Always enabled - required for proper timeline sync
            strategy: 'merge-timelines',
            createMergeCommits: true,
            mergeMessage: 'Sync: Merge timeline from {source} to {target}'
          },
          botBranches: {
            strategy: 'delete-orphaned', // Default: clean up orphaned bot branches
            patterns: [] // Empty = use default patterns
          }
        },
        // HIGH: Core sync features - most users want these
        tags: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          pattern: '*'
        },
        releases: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          latestReleaseStrategy: 'point-to-latest',
          skipPreReleases: false,
          pattern: '*',
          includeAssets: true
        },
        // MEDIUM: Social features - can be noisy, disabled by default
        pullRequests: {
          enabled: false, // Changed: Can be overwhelming, user choice
          autoMerge: false,
          comments: {
            enabled: false, // LOW: Very noisy, advanced feature
            attribution: {
              includeAuthor: true,
              includeTimestamp: true,
              includeSourceLink: true,
              format: 'quoted'
            },
            handleUpdates: true,
            preserveFormatting: true,
            syncReplies: true
          }
        },
        issues: {
          enabled: false, // Changed: Can be very noisy, user choice
          comments: {
            enabled: false, // LOW: Very noisy, advanced feature
            attribution: {
              includeAuthor: true,
              includeTimestamp: true,
              includeSourceLink: true,
              format: 'quoted'
            },
            handleUpdates: true,
            preserveFormatting: true,
            syncReplies: true
          }
        }
      }
    },
    gitlab: {
      enabled: true,
      createIfNotExists: false,
      sync: {
        // CRITICAL: Foundation for all sync operations
        branches: {
          enabled: true,
          protected: true,
          pattern: '*',
          historySync: {
            enabled: true, // Always enabled - required for proper timeline sync
            strategy: 'merge-timelines',
            createMergeCommits: true,
            mergeMessage: 'Sync: Merge timeline from {source} to {target}'
          },
          botBranches: {
            strategy: 'delete-orphaned', // Default: clean up orphaned bot branches
            patterns: [] // Empty = use default patterns
          }
        },
        // HIGH: Core sync features - most users want these
        tags: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          pattern: '*'
        },
        releases: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          latestReleaseStrategy: 'point-to-latest',
          skipPreReleases: false,
          pattern: '*',
          includeAssets: true
        },
        // MEDIUM: Social features - can be noisy, disabled by default
        pullRequests: {
          enabled: false, // Changed: Can be overwhelming, user choice
          autoMerge: false,
          comments: {
            enabled: false, // LOW: Very noisy, advanced feature
            attribution: {
              includeAuthor: true,
              includeTimestamp: true,
              includeSourceLink: true,
              format: 'quoted'
            },
            handleUpdates: true,
            preserveFormatting: true,
            syncReplies: true
          }
        },
        issues: {
          enabled: false, // Changed: Can be very noisy, user choice
          comments: {
            enabled: false, // LOW: Very noisy, advanced feature
            attribution: {
              includeAuthor: true,
              includeTimestamp: true,
              includeSourceLink: true,
              format: 'quoted'
            },
            handleUpdates: true,
            preserveFormatting: true,
            syncReplies: true
          }
        }
      }
    }
  }
}
