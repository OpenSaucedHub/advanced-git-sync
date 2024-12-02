import { Repository } from '@/src/types'

export function getProjectPath(repo: Repository): string {
  return `${repo.owner}/${repo.repo}`
}

export function getProjectId(repo: Repository): string {
  return encodeURIComponent(getProjectPath(repo))
}

export function getApiBaseUrl(host?: string): string {
  const baseUrl = host?.replace(/\/$/, '') || 'https://gitlab.com'
  return `${baseUrl}/api/v4`
}
