import { z } from 'zod'

export const SyncConfigSchema = z.object({
  gitlab: z.object({
    url: z.string().url(),
    token: z.string(),
    username: z.string()
  }),
  sync: z
    .object({
      branches: z
        .object({
          enabled: z.boolean().default(true),
          protected: z.boolean().default(true),
          pattern: z.string().optional()
        })
        .default({}),
      pullRequests: z
        .object({
          enabled: z.boolean().default(true),
          autoMerge: z.boolean().default(false),
          labels: z.array(z.string()).default([])
        })
        .default({}),
      issues: z
        .object({
          enabled: z.boolean().default(true),
          labels: z.array(z.string()).default([]),
          syncComments: z.boolean().default(true)
        })
        .default({})
    })
    .default({})
})

export type SyncConfig = z.infer<typeof SyncConfigSchema>
