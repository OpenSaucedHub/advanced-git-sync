// cleanup-all.js
import { githubApi } from './utils'
import { createInterface } from 'readline'

const owner = 'OpenSaucedHub'
const repo = 'advanced-git-sync'

async function confirm() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(
      `WARNING: This will delete ALL releases and tags for ${owner}/${repo}.
      This operation is irreversible. 
To proceed, type "${owner}/${repo}":
> `,
      answer => {
        rl.close()
        resolve(
          answer.trim().toLowerCase() === `${owner}/${repo}`.toLowerCase()
        )
      }
    )
  })
}

async function deleteAll() {
  try {
    const confirmed = await confirm()
    if (!confirmed) {
      console.log('Confirmation failed. Operation cancelled.')
      return
    }

    console.log(
      `Confirmation successful. Starting complete cleanup on ${owner}/${repo} ...`
    )

    // First delete releases
    const { data: releases } = await githubApi.get(
      `/repos/${owner}/${repo}/releases`
    )
    for (const release of releases) {
      await githubApi.delete(`/repos/${owner}/${repo}/releases/${release.id}`)
      console.log(`Deleted release: ${release.tag_name}`)
    }

    // Then delete tags
    const { data: tags } = await githubApi.get(`/repos/${owner}/${repo}/tags`)
    for (const tag of tags) {
      await githubApi.delete(
        `/repos/${owner}/${repo}/git/refs/tags/${tag.name}`
      )
      console.log(`Deleted tag: ${tag.name}`)
    }

    console.log('Cleanup completed!')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

deleteAll().catch(console.error)
