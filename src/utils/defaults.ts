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
          pattern: '*'
        },
        pullRequests: {
          enabled: true,
          autoMerge: false,
          labels: ['synced']
        },
        issues: {
          enabled: true,
          syncComments: false,
          labels: ['synced']
        },
        releases: {
          enabled: true
        },
        tags: {
          enabled: true
        }
      }
    },
    gitlab: {
      enabled: true,
      sync: {
        branches: {
          enabled: true,
          protected: true,
          pattern: '*'
        },
        pullRequests: {
          enabled: true,
          autoMerge: false,
          labels: ['synced']
        },
        issues: {
          enabled: true,
          syncComments: false,
          labels: ['synced']
        },
        releases: {
          enabled: true
        },
        tags: {
          enabled: true
        }
      }
    }
  }
}
