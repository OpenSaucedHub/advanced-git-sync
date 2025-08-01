// src/types/config.ts
import { z } from 'zod'

export const BranchConfigSchema = z.object({
  enabled: z.boolean(),
  protected: z.boolean(),
  pattern: z.string()
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
  syncComments: z.boolean(),
  labels: z
    .any()
    .transform(normalizeLabels)
    .pipe(z.union([z.string(), z.array(z.string())]))
})

export const SyncConfigSchema = z.object({
  branches: BranchConfigSchema,
  pullRequests: PRConfigSchema,
  issues: IssueConfigSchema,
  releases: z.object({ enabled: z.boolean() }),
  tags: z.object({ enabled: z.boolean() })
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
export type SyncConfig = z.infer<typeof SyncConfigSchema>
export type GitlabConfig = z.infer<typeof GitlabConfigSchema>
export type GithubConfig = z.infer<typeof GithubConfigSchema>
export type Config = z.infer<typeof ConfigSchema>
