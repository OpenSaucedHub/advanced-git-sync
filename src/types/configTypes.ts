// src/types/config.ts
import { z } from 'zod'

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
    .optional()
})

// Helper function to normalize labels from various YAML formats
const normalizeLabels = (val: unknown): string | string[] => {
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val
  // Handle object-like arrays from YAML parsing (e.g., when YAML parser creates objects)
  if (typeof val === 'object' && val !== null) {
    const values = Object.values(val)
    if (values.every(v => typeof v === 'string')) {
      return values as string[]
    }
  }
  // Fallback: convert to string if possible
  if (val !== null && val !== undefined) {
    return String(val)
  }
  return []
}

export const PRConfigSchema = z.object({
  enabled: z.boolean(),
  autoMerge: z.boolean(),
  labels: z
    .any()
    .transform(normalizeLabels)
    .pipe(z.union([z.string(), z.array(z.string())]))
})

export const IssueConfigSchema = z.object({
  enabled: z.boolean(),
  labels: z
    .any()
    .transform(normalizeLabels)
    .pipe(z.union([z.string(), z.array(z.string())]))
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
  sync: SyncConfigSchema.optional()
})

export const GithubConfigSchema = z.object({
  enabled: z.boolean(),
  token: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
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
