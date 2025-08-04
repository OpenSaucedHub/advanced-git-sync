// src/sync/__tests__/issueSync.test.ts
import { syncIssues, compareIssues } from '../issueSync'
import { Issue, Comment } from '../../types'
import { GitHubClient } from '../../structures/github/GitHub'
import { GitLabClient } from '../../structures/gitlab/GitLab'

// Mock clients
const mockGitHubClient = {
  config: {
    github: {
      enabled: true,
      sync: {
        issues: {
          enabled: true,
          labels: [],
          comments: {
            enabled: true,
            attribution: {
              includeAuthor: true,
              includeTimestamp: true,
              includeSourceLink: true,
              format: 'quoted'
            },
            handleUpdates: true,
            preserveFormatting: true,
            syncReplies: true
          }
        }
      }
    },
    gitlab: { enabled: true }
  },
  getRepoInfo: () => ({
    owner: 'testowner',
    repo: 'testrepo',
    url: 'https://github.com/testowner/testrepo'
  }),
  syncIssues: jest.fn(),
  createIssue: jest.fn(),
  updateIssue: jest.fn(),
  issue: {
    fetchIssueComments: jest.fn(),
    createIssueComment: jest.fn(),
    updateIssueComment: jest.fn()
  }
} as unknown as GitHubClient

const mockGitLabClient = {
  config: {
    github: { enabled: true },
    gitlab: {
      enabled: true,
      sync: {
        issues: {
          enabled: true,
          labels: [],
          comments: {
            enabled: true,
            attribution: {
              includeAuthor: true,
              includeTimestamp: true,
              includeSourceLink: true,
              format: 'quoted'
            },
            handleUpdates: true,
            preserveFormatting: true,
            syncReplies: true
          }
        }
      }
    }
  },
  getRepoInfo: () => ({
    owner: 'testowner',
    repo: 'testrepo',
    url: 'https://gitlab.com/testowner/testrepo'
  }),
  syncIssues: jest.fn(),
  createIssue: jest.fn(),
  updateIssue: jest.fn(),
  issues: {
    fetchIssueComments: jest.fn(),
    createIssueComment: jest.fn(),
    updateIssueComment: jest.fn()
  },
  getProjectId: jest.fn().mockResolvedValue(123)
} as unknown as GitLabClient

const mockIssueWithComments: Issue = {
  title: 'Test Issue',
  body: 'This is a test issue',
  number: 1,
  state: 'open',
  labels: ['bug'],
  comments: [
    {
      id: 101,
      body: 'First comment',
      author: 'user1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      sourceUrl:
        'https://github.com/testowner/testrepo/issues/1#issuecomment-101'
    },
    {
      id: 102,
      body: 'Second comment with `code`',
      author: 'user2',
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
      sourceUrl:
        'https://github.com/testowner/testrepo/issues/1#issuecomment-102'
    }
  ]
}

const mockIssueWithoutComments: Issue = {
  title: 'Simple Issue',
  body: 'This is a simple issue',
  number: 2,
  state: 'open',
  labels: ['enhancement']
}

describe('Issue Sync with Comments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('compareIssues', () => {
    it('should identify issues that need to be created', () => {
      const sourceIssues = [mockIssueWithComments]
      const targetIssues: Issue[] = []

      const comparisons = compareIssues(sourceIssues, targetIssues)

      expect(comparisons).toHaveLength(1)
      expect(comparisons[0].action).toBe('create')
      expect(comparisons[0].sourceIssue.title).toBe('Test Issue')
    })

    it('should identify issues that need to be updated', () => {
      const sourceIssues = [mockIssueWithComments]
      const targetIssues = [
        {
          ...mockIssueWithComments,
          body: 'Different body content'
        }
      ]

      const comparisons = compareIssues(sourceIssues, targetIssues)

      expect(comparisons).toHaveLength(1)
      expect(comparisons[0].action).toBe('update')
    })

    it('should skip issues that are already in sync', () => {
      const sourceIssues = [mockIssueWithoutComments]
      const targetIssues = [mockIssueWithoutComments]

      const comparisons = compareIssues(sourceIssues, targetIssues)

      expect(comparisons).toHaveLength(1)
      expect(comparisons[0].action).toBe('skip')
    })
  })

  describe('syncIssues', () => {
    it('should sync issues with comments when comment sync is enabled', async () => {
      // Mock the source to return issues with comments
      ;(mockGitHubClient.syncIssues as jest.Mock).mockResolvedValue([
        mockIssueWithComments
      ])
      // Mock the target to return no existing issues
      ;(mockGitLabClient.syncIssues as jest.Mock).mockResolvedValue([])
      // Mock existing comments fetch to return empty array
      ;(
        mockGitLabClient.issues.fetchIssueComments as jest.Mock
      ).mockResolvedValue([])

      await syncIssues(mockGitHubClient, mockGitLabClient)

      // Verify issue was created
      expect(mockGitLabClient.createIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Issue',
          body: expect.stringContaining('This is a test issue')
        })
      )

      // Verify comments were created
      expect(mockGitLabClient.issues.createIssueComment).toHaveBeenCalledTimes(
        2
      )
      expect(mockGitLabClient.issues.createIssueComment).toHaveBeenCalledWith(
        1,
        expect.stringContaining('**💬 Comment by @user1 on GitHub**')
      )
      expect(mockGitLabClient.issues.createIssueComment).toHaveBeenCalledWith(
        1,
        expect.stringContaining('**💬 Comment by @user2 on GitHub**')
      )
    })

    it('should not sync comments when comment sync is disabled', async () => {
      // Create a client with comment sync disabled
      const clientWithoutCommentSync = {
        ...mockGitHubClient,
        config: {
          ...mockGitHubClient.config,
          github: {
            ...mockGitHubClient.config.github,
            sync: {
              ...mockGitHubClient.config.github.sync,
              issues: {
                ...mockGitHubClient.config.github.sync!.issues,
                comments: {
                  ...mockGitHubClient.config.github.sync!.issues.comments,
                  enabled: false
                }
              }
            }
          }
        }
      } as unknown as GitHubClient

      ;(clientWithoutCommentSync.syncIssues as jest.Mock).mockResolvedValue([
        mockIssueWithComments
      ])
      ;(mockGitLabClient.syncIssues as jest.Mock).mockResolvedValue([])

      await syncIssues(clientWithoutCommentSync, mockGitLabClient)

      // Verify issue was created but comments were not synced
      expect(mockGitLabClient.createIssue).toHaveBeenCalled()
      expect(mockGitLabClient.issues.createIssueComment).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully during comment sync', async () => {
      ;(mockGitHubClient.syncIssues as jest.Mock).mockResolvedValue([
        mockIssueWithComments
      ])
      ;(mockGitLabClient.syncIssues as jest.Mock).mockResolvedValue([])
      ;(
        mockGitLabClient.issues.fetchIssueComments as jest.Mock
      ).mockRejectedValue(new Error('API Error'))

      // Should not throw an error
      await expect(
        syncIssues(mockGitHubClient, mockGitLabClient)
      ).resolves.not.toThrow()

      // Issue should still be created
      expect(mockGitLabClient.createIssue).toHaveBeenCalled()
    })
  })
})
