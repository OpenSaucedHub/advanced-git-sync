// src/utils/defaults.ts
import { Config } from '../types'

export function getDefaultConfig(): Config {
  return {
    github: {
      enabled: true,
      sync: {
        branches: {
          enabled: true,
          protected: true,
          pattern: '*',
          historySync: {
            enabled: true,
            strategy: 'merge-timelines',
            createMergeCommits: true,
            mergeMessage: 'Sync: Merge timeline from {source} to {target}'
          }
        },
        pullRequests: {
          enabled: true,
          autoMerge: false,
          labels: ['synced'],
          comments: {
            enabled: false,
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
          enabled: true,
          labels: ['synced'],
          comments: {
            enabled: false,
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
        releases: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          latestReleaseStrategy: 'point-to-latest',
          skipPreReleases: false,
          pattern: '*',
          includeAssets: true
        },
        tags: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          pattern: '*'
        }
      }
    },
    gitlab: {
      enabled: true,
      sync: {
        branches: {
          enabled: true,
          protected: true,
          pattern: '*',
          historySync: {
            enabled: true,
            strategy: 'merge-timelines',
            createMergeCommits: true,
            mergeMessage: 'Sync: Merge timeline from {source} to {target}'
          }
        },
        pullRequests: {
          enabled: true,
          autoMerge: false,
          labels: ['synced'],
          comments: {
            enabled: false,
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
          enabled: true,
          labels: ['synced'],
          comments: {
            enabled: false,
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
        releases: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          latestReleaseStrategy: 'point-to-latest',
          skipPreReleases: false,
          pattern: '*',
          includeAssets: true
        },
        tags: {
          enabled: true,
          divergentCommitStrategy: 'skip',
          pattern: '*'
        }
      }
    }
  }
}
