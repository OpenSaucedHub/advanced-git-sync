import { gitlabProjectHelper } from '../gitLabProject'
import { Repository } from '@/src/types'

describe('gitlabProjectHelper', () => {
  let mockGitlab: any
  let repo: Repository
  let creator: gitlabProjectHelper

  beforeEach(() => {
    repo = { owner: 'testowner', repo: 'testrepo' }
    mockGitlab = {
      Projects: {
        show: jest.fn(),
        create: jest.fn()
      },
      Groups: {
        show: jest.fn()
      },
      Users: {
        search: jest.fn(),
        current: jest.fn()
      }
    }
    creator = new gitlabProjectHelper(mockGitlab, repo)
  })

  describe('createIfNotExists', () => {
    it('should return existing project ID if project exists', async () => {
      mockGitlab.Projects.show.mockResolvedValue({ id: 123 })

      const result = await creator.createIfNotExists()

      expect(result).toBe(123)
      expect(mockGitlab.Projects.show).toHaveBeenCalledWith(
        'testowner/testrepo'
      )
    })

    it('should create project if 404 and return new project ID', async () => {
      mockGitlab.Projects.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Groups.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Users.search.mockResolvedValue([
        { username: 'testowner', id: 456 }
      ])
      mockGitlab.Projects.create.mockResolvedValue({ id: 789 })

      const result = await creator.createIfNotExists()

      expect(result).toBe(789)
      expect(mockGitlab.Projects.create).toHaveBeenCalledWith({
        name: 'testrepo',
        path: 'testrepo',
        visibility: 'private',
        description:
          'Repository automatically created by advanced-git-sync for synchronization',
        initialize_with_readme: true,
        issues_enabled: true,
        merge_requests_enabled: true,
        wiki_enabled: false,
        snippets_enabled: false,
        container_registry_enabled: false,
        namespace_id: 456
      })
    })

    it('should use group namespace if owner is a group', async () => {
      mockGitlab.Projects.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Groups.show.mockResolvedValue({ id: 999 })
      mockGitlab.Projects.create.mockResolvedValue({ id: 789 })

      const result = await creator.createIfNotExists()

      expect(result).toBe(789)
      expect(mockGitlab.Projects.create).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace_id: 999
        })
      )
    })

    it('should fallback to current user if namespace not found', async () => {
      mockGitlab.Projects.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Groups.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Users.search.mockResolvedValue([])
      mockGitlab.Users.current.mockResolvedValue({ id: 111 })
      mockGitlab.Projects.create.mockResolvedValue({ id: 789 })

      const result = await creator.createIfNotExists()

      expect(result).toBe(789)
      expect(mockGitlab.Projects.create).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace_id: 111
        })
      )
    })

    it('should create without namespace_id if no namespace found', async () => {
      mockGitlab.Projects.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Groups.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Users.search.mockResolvedValue([])
      mockGitlab.Users.current.mockRejectedValue(new Error('No current user'))
      mockGitlab.Projects.create.mockResolvedValue({ id: 789 })

      const result = await creator.createIfNotExists()

      expect(result).toBe(789)
      const createCall = mockGitlab.Projects.create.mock.calls[0][0]
      expect(createCall).not.toHaveProperty('namespace_id')
    })

    it('should throw error for non-404 errors', async () => {
      mockGitlab.Projects.show.mockRejectedValue({ response: { status: 403 } })

      await expect(creator.createIfNotExists()).rejects.toThrow()
    })

    it('should handle 403 permission error during creation', async () => {
      mockGitlab.Projects.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Groups.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Users.search.mockResolvedValue([
        { username: 'testowner', id: 456 }
      ])
      mockGitlab.Projects.create.mockRejectedValue({
        response: { status: 403 }
      })

      await expect(creator.createIfNotExists()).rejects.toThrow(
        'Insufficient permissions to create project'
      )
    })

    it('should handle 400 validation error during creation', async () => {
      mockGitlab.Projects.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Groups.show.mockRejectedValue({ response: { status: 404 } })
      mockGitlab.Users.search.mockResolvedValue([
        { username: 'testowner', id: 456 }
      ])
      mockGitlab.Projects.create.mockRejectedValue({
        response: { status: 400 }
      })

      await expect(creator.createIfNotExists()).rejects.toThrow(
        'Project name "testrepo" conflicts or validation failed'
      )
    })
  })
})
