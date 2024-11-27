// cleanup-specific.js
const { githubApi /* unpublishNpmVersion */ } = require('./utils')
const readline = require('readline')

const owner = 'iamvikshan'
const repo = 'link-updater'
const tag = 'v1.1.4'
const npmVersion = tag.replace('v', '')

async function confirm(message) {
  const rl = readline.createInterface({
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

async function deleteSpecific() {
  try {
    // GitHub Release Check & Delete
    const { data: releases } = await githubApi.get(
      `/repos/${owner}/${repo}/releases`
    )
    const release = releases.find(r => r.tag_name === tag)

    if (release) {
      const confirmed = await confirm(`Delete GitHub release ${tag}?`)
      if (confirmed) {
        try {
          await githubApi.delete(
            `/repos/${owner}/${repo}/releases/${release.id}`
          )
          console.log(`[GitHub] Deleted release: ${tag}`)
        } catch (error) {
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
      } catch (error) {
        if (error.response?.status === 422 || error.response?.status === 404) {
          console.log(`[GitHub] Tag ${tag} already deleted or doesn't exist`)
        } else {
          console.error(`[GitHub] Failed to delete tag: ${error.message}`)
        }
      }
    }

    // NPM Package Delete - Independent of GitHub operations
    // Note: Unpublishing npm versions can have significant consequences.
    // Please read the npm documentation on unpublishing before uncommenting the code below.
    // https://docs.npmjs.com/policies/unpublish

    /*
    const npmConfirmed = await confirm(
      `Delete npm package version ${npmVersion}?`
    )
    if (npmConfirmed) {
      const npmDeleted = await unpublishNpmVersion(npmVersion)
      if (npmDeleted) {
        console.log(`[NPM] Deleted package version: ${npmVersion}`)
      }
    }
    */
  } catch (error) {
    console.error('[Error] Failed to fetch repository data:', error.message)
  }
}

deleteSpecific().catch(console.error)
