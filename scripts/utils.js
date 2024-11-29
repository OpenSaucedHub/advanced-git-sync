// utils.js
import axios from 'axios'

if (!process.env.GH_TOKEN) {
  throw new Error('GH_TOKEN environment variable is required but not found')
}

export const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${process.env.GH_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }
})
