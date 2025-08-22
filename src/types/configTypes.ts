// src/types/config.ts
import { z } from 'zod'

export const BotBranchConfigSchema = z.object({
  strategy: z
    .enum(['delete-orphaned', 'sync', 'skip'])
    .default('delete-orphaned'),
  patterns: z.array(z.string()).default([])
})

export const BranchConfigSchema = z.object({
  enabled: z.boolean(),
  protected: z.boolean(),
  pattern: z.string(),
  historySync: z
    .object({
      enabled: z.boolean().default(true),
      strategy: z
        .enum(['merge-timelines', 'skip-diverged', 'force-match'])
        .default('merge-timelines'),
      createMergeCommits: z.boolean().default(true),
      mergeMessage: z
        .string()
        .default('Sync: Merge timeline from {source} to {target}')
    })
    .optional(),
  botBranches: BotBranchConfigSchema.optional()
})

export const PRConfigSchema = z.object({
  enabled: z.boolean(),
  autoMerge: z.boolean(),
  comments: z
    .object({
      enabled: z.boolean().default(false),
      attribution: z
        .object({
          includeAuthor: z.boolean().default(true),
          includeTimestamp: z.boolean().default(true),
          includeSourceLink: z.boolean().default(true),
          format: z.enum(['quoted', 'inline', 'minimal']).default('quoted')
        })
        .default({
          includeAuthor: true,
          includeTimestamp: true,
          includeSourceLink: true,
          format: 'quoted'
        }),
      handleUpdates: z.boolean().default(true),
      preserveFormatting: z.boolean().default(true),
      syncReplies: z.boolean().default(true)
    })
    .default({
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
    })
})

export const IssueConfigSchema = z.object({
  enabled: z.boolean(),
  comments: z
    .object({
      enabled: z.boolean().default(false),
      attribution: z
        .object({
          includeAuthor: z.boolean().default(true),
          includeTimestamp: z.boolean().default(true),
          includeSourceLink: z.boolean().default(true),
          format: z.enum(['quoted', 'inline', 'minimal']).default('quoted')
        })
        .default({
          includeAuthor: true,
          includeTimestamp: true,
          includeSourceLink: true,
          format: 'quoted'
        }),
      handleUpdates: z.boolean().default(true),
      preserveFormatting: z.boolean().default(true),
      syncReplies: z.boolean().default(true)
    })
    .default({
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
    })
})

export const ReleaseConfigSchema = z.object({
  enabled: z.boolean(),
  divergentCommitStrategy: z
    .enum(['skip', 'create-anyway', 'point-to-latest'])
    .default('skip'),
  latestReleaseStrategy: z
    .enum(['skip', 'point-to-latest', 'create-anyway'])
    .default('point-to-latest'),
  skipPreReleases: z.boolean().default(false),
  pattern: z.string().default('*'),
  includeAssets: z.boolean().default(true)
})

export const TagConfigSchema = z.object({
  enabled: z.boolean(),
  divergentCommitStrategy: z
    .enum(['skip', 'create-anyway', 'point-to-latest'])
    .default('skip'),
  pattern: z.string().default('*')
})

export const SyncConfigSchema = z.object({
  branches: BranchConfigSchema,
  pullRequests: PRConfigSchema,
  issues: IssueConfigSchema,
  releases: ReleaseConfigSchema,
  tags: TagConfigSchema
})

export const GitlabConfigSchema = z.object({
  enabled: z.boolean(),
  projectId: z.number().optional().nullable(),
  host: z.string().optional(),
  token: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
  createIfNotExists: z.boolean().optional().default(false),
  sync: SyncConfigSchema.optional()
})

export const GithubConfigSchema = z.object({
  enabled: z.boolean(),
  token: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
  createIfNotExists: z.boolean().optional().default(false),
  sync: SyncConfigSchema.optional()
})

export const ConfigSchema = z.object({
  gitlab: GitlabConfigSchema,
  github: GithubConfigSchema
})

export type BranchConfig = z.infer<typeof BranchConfigSchema>
export type PRConfig = z.infer<typeof PRConfigSchema>
export type IssueConfig = z.infer<typeof IssueConfigSchema>
export type ReleaseConfig = z.infer<typeof ReleaseConfigSchema>
export type TagConfig = z.infer<typeof TagConfigSchema>
export type SyncConfig = z.infer<typeof SyncConfigSchema>
export type GitlabConfig = z.infer<typeof GitlabConfigSchema>
export type GithubConfig = z.infer<typeof GithubConfigSchema>
export type Config = z.infer<typeof ConfigSchema>
