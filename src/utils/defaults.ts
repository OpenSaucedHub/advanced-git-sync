// src/utils/defaults.ts
import { Config } from '../types'

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
