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
          labels: ['synced']
        },
        issues: {
          enabled: true,
          labels: ['synced']
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
          labels: ['synced']
        },
        issues: {
          enabled: true,
          labels: ['synced']
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
