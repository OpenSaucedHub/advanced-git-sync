import { githubRepoHelper } from '../gitHubRepo'
import { Repository } from '@/src/types'

describe('githubRepoHelper', () => {
  let mockOctokit: any
  let repo: Repository
  let creator: githubRepoHelper

  beforeEach(() => {
    repo = { owner: 'testowner', repo: 'testrepo' }
    mockOctokit = {
      rest: {
        repos: {
          get: jest.fn(),
          createForAuthenticatedUser: jest.fn(),
          createInOrg: jest.fn()
        },
        orgs: {
          get: jest.fn()
        }
      }
    }
    creator = new githubRepoHelper(mockOctokit, repo)
  })

  describe('createIfNotExists', () => {
    it('should return false if repository already exists', async () => {
      mockOctokit.rest.repos.get.mockResolvedValue({ data: { id: 123 } })

      const result = await creator.createIfNotExists()

      expect(result).toBe(false)
      expect(mockOctokit.rest.repos.get).toHaveBeenCalledWith(repo)
    })

    it('should create personal repository if 404 and owner is not an org', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({ status: 404 })
      mockOctokit.rest.orgs.get.mockRejectedValue({ status: 404 })
      mockOctokit.rest.repos.createForAuthenticatedUser.mockResolvedValue({
        data: { id: 123 }
      })

      const result = await creator.createIfNotExists()

      expect(result).toBe(true)
      expect(
        mockOctokit.rest.repos.createForAuthenticatedUser
      ).toHaveBeenCalledWith({
        name: 'testrepo',
        private: true,
        description:
          'Repository automatically created by advanced-git-sync for synchronization',
        auto_init: true,
        has_issues: true,
        has_projects: false,
        has_wiki: false
      })
    })

    it('should create organization repository if 404 and owner is an org', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({ status: 404 })
      mockOctokit.rest.orgs.get.mockResolvedValue({ data: { id: 456 } })
      mockOctokit.rest.repos.createInOrg.mockResolvedValue({
        data: { id: 123 }
      })

      const result = await creator.createIfNotExists()

      expect(result).toBe(true)
      expect(mockOctokit.rest.repos.createInOrg).toHaveBeenCalledWith({
        org: 'testowner',
        name: 'testrepo',
        private: true,
        description:
          'Repository automatically created by advanced-git-sync for synchronization',
        auto_init: true,
        has_issues: true,
        has_projects: false,
        has_wiki: false
      })
    })

    it('should throw error for non-404 errors', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({
        status: 403,
        message: 'Forbidden'
      })

      await expect(creator.createIfNotExists()).rejects.toThrow()
    })

    it('should handle 403 permission error during creation', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({ status: 404 })
      mockOctokit.rest.orgs.get.mockRejectedValue({ status: 404 })
      mockOctokit.rest.repos.createForAuthenticatedUser.mockRejectedValue({
        status: 403
      })

      await expect(creator.createIfNotExists()).rejects.toThrow(
        'Insufficient permissions to create repository'
      )
    })

    it('should handle 422 validation error during creation', async () => {
      mockOctokit.rest.repos.get.mockRejectedValue({ status: 404 })
      mockOctokit.rest.orgs.get.mockRejectedValue({ status: 404 })
      mockOctokit.rest.repos.createForAuthenticatedUser.mockRejectedValue({
        status: 422
      })

      await expect(creator.createIfNotExists()).rejects.toThrow(
        'Repository name "testrepo" conflicts or validation failed'
      )
    })
  })
})
