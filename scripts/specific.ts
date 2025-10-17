// cleanup-specific.ts
import { githubApi } from './utils'
import { createInterface } from 'readline'

const owner = 'OpenSaucedHub'
const repo = 'advanced-git-sync'
const tag = 'v1.1.4'

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y')
    })
  })
}

async function deleteSpecific(): Promise<void> {
  try {
    // GitHub Release Check & Delete
    const { data: releases } = await githubApi.get(
      `/repos/${owner}/${repo}/releases`
    )
    const release = releases.find((r: any) => r.tag_name === tag)

    if (release) {
      const confirmed = await confirm(`Delete GitHub release ${tag}?`)
      if (confirmed) {
        try {
          await githubApi.delete(
            `/repos/${owner}/${repo}/releases/${release.id}`
          )
          console.log(`[GitHub] Deleted release: ${tag}`)
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.log(`[GitHub] Release ${tag} already deleted`)
          } else {
            console.error(`[GitHub] Failed to delete release: ${error.message}`)
          }
        }
      }
    } else {
      console.log(`[GitHub] Release ${tag} not found`)
    }

    // GitHub Tag Check & Delete
    const tagConfirmed = await confirm(`Delete GitHub tag ${tag}?`)
    if (tagConfirmed) {
      try {
        await githubApi.delete(`/repos/${owner}/${repo}/git/refs/tags/${tag}`)
        console.log(`[GitHub] Deleted tag: ${tag}`)
      } catch (error: any) {
        if (error.response?.status === 422 || error.response?.status === 404) {
          console.log(`[GitHub] Tag ${tag} already deleted or doesn't exist`)
        } else {
          console.error(`[GitHub] Failed to delete tag: ${error.message}`)
        }
      }
    }
  } catch (error) {
    console.error(
      '[Error] Failed to fetch repository data:',
      (error as Error).message
    )
  }
}

deleteSpecific().catch(console.error)
