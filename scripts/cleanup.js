// cleanup-all.js
const { githubApi /* unpublishNpmVersion */ } = require('./utils')
const readline = require('readline')

const owner = 'iamvikshan'
const repo = 'link-updater'

async function confirm() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(
      'WARNING: This will delete ALL releases and tags. Are you absolutely sure? (type "YES" to confirm): ',
      answer => {
        rl.close()
        resolve(answer === 'YES')
      }
    )
  })
}

async function deleteAll() {
  try {
    const confirmed = await confirm()
    if (!confirmed) {
      console.log('Operation cancelled')
      return
    }

    console.log('Starting complete cleanup...')

    // First delete releases
    const { data: releases } = await githubApi.get(
      `/repos/${owner}/${repo}/releases`
    )
    for (const release of releases) {
      await githubApi.delete(`/repos/${owner}/${repo}/releases/${release.id}`)
      console.log(`Deleted release: ${release.tag_name}`)

      // Note: Unpublishing npm versions can have significant consequences.
      // Please read the npm documentation on unpublishing before uncommenting the code below.
      // https://docs.npmjs.com/policies/unpublish

      // const npmVersion = release.tag_name.replace('v', '')
      // await unpublishNpmVersion(npmVersion)
      // console.log(`Deleted npm package version: ${npmVersion}`)
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
