// src/types/config.ts
import { z } from 'zod'

export const BranchConfigSchema = z.object({
  enabled: z.boolean(),
  protected: z.boolean(),
  pattern: z.string()
})

export const PRConfigSchema = z.object({
  enabled: z.boolean(),
  autoMerge: z.boolean(),
  labels: z.array(z.string())
})

export const IssueConfigSchema = z.object({
  enabled: z.boolean(),
  syncComments: z.boolean(),
  labels: z.array(z.string())
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
  url: z.string().optional(),
  token: z.string().optional(),
  username: z.string().optional(),
  repo: z.string().optional(),
  sync: SyncConfigSchema.optional()
})

export const GithubConfigSchema = z.object({
  enabled: z.boolean(),
  token: z.string().optional(),
  username: z.string().optional(),
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
