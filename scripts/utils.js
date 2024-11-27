// utils.js
require('dotenv').config()
const axios = require('axios')
// const { exec } = require('child_process')
// const util = require('util')

if (!process.env.GH_TOKEN) {
  throw new Error('GH_TOKEN environment variable is required but not found')
}

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${process.env.GH_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }
})

// Note: Unpublishing npm versions can have significant consequences.
// Please read the npm documentation on unpublishing before uncommenting the code below.
// https://docs.npmjs.com/policies/unpublish

/*
// const execAsync = util.promisify(exec)

// const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// async function unpublishNpmVersion(version) {
  // const maxRetries = 3
  // const baseDelay = 1000

  // for (let attempt = 1; attempt <= maxRetries; attempt++) {
  //   try {
  //     await execAsync(`bunx npm unpublish links-updater@${version} --force`, {
  //       env: { ...process.env, NPM_TOKEN: process.env.NPM_TOKEN }
  //     })
  //     return true
  //   } catch (error) {
  //     if (error.message.includes('429') && attempt < maxRetries) {
  //       const waitTime = baseDelay * Math.pow(2, attempt - 1)
  //       console.log(`Rate limited. Retrying in ${waitTime / 1000} seconds...`)
  //       await delay(waitTime)
  //       continue
  //     }
  //     console.error(`Failed to unpublish npm version: ${error.message}`)
  //     return false
  //   }
  // }
  // return false
// } */

module.exports = { githubApi /* unpublishNpmVersion */ }
