// src/utils/__tests__/commentUtils.test.ts
import { CommentFormatter, getCommentSyncOptions } from '../commentUtils'
import { Comment, Config } from '../../types'
import { GitHubClient } from '../../structures/github/GitHub'
import { GitLabClient } from '../../structures/gitlab/GitLab'

// Mock clients
const mockGitHubClient = {
  getRepoInfo: () => ({
    owner: 'testowner',
    repo: 'testrepo',
    url: 'https://github.com/testowner/testrepo'
  })
} as GitHubClient

const mockGitLabClient = {
  getRepoInfo: () => ({
    owner: 'testowner',
    repo: 'testrepo',
    url: 'https://gitlab.com/testowner/testrepo'
  })
} as GitLabClient

const mockComment: Comment = {
  id: 123,
  body: 'This is a test comment with `code` and [link](https://example.com)',
  author: 'testuser',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:35:00Z',
  sourceUrl: 'https://github.com/testowner/testrepo/issues/1#issuecomment-123'
}

const mockCommentSyncOptions = {
  enabled: true,
  attribution: {
    includeAuthor: true,
    includeTimestamp: true,
    includeSourceLink: true,
    format: 'quoted' as const
  },
  handleUpdates: true,
  preserveFormatting: true,
  syncReplies: true
}

describe('CommentFormatter', () => {
  describe('formatSyncedComment', () => {
    it('should format comment in quoted style', () => {
      const result = CommentFormatter.formatSyncedComment(
        mockComment,
        mockGitHubClient,
        1,
        mockCommentSyncOptions
      )

      expect(result).toContain('**💬 Comment by @testuser on GitHub**')
      expect(result).toContain(
        '([original](https://github.com/testowner/testrepo/issues/1#issuecomment-123))'
      )
      expect(result).toContain('> This is a test comment')
      expect(result).toContain('*Synced from GitHub on 2024-01-15*')
    })

    it('should format comment in inline style', () => {
      const options = {
        ...mockCommentSyncOptions,
        attribution: {
          ...mockCommentSyncOptions.attribution,
          format: 'inline' as const
        }
      }

      const result = CommentFormatter.formatSyncedComment(
        mockComment,
        mockGitHubClient,
        1,
        options
      )

      expect(result).toContain('**@testuser** (GitHub):')
      expect(result).toContain(
        '[🔗](https://github.com/testowner/testrepo/issues/1#issuecomment-123)'
      )
      expect(result).toContain('This is a test comment')
    })

    it('should format comment in minimal style', () => {
      const options = {
        ...mockCommentSyncOptions,
        attribution: {
          ...mockCommentSyncOptions.attribution,
          format: 'minimal' as const
        }
      }

      const result = CommentFormatter.formatSyncedComment(
        mockComment,
        mockGitLabClient,
        1,
        options
      )

      expect(result).toContain('This is a test comment')
      expect(result).toContain('— @testuser')
    })

    it('should preserve markdown formatting', () => {
      const commentWithCode: Comment = {
        ...mockComment,
        body: 'Here is some code:\n```javascript\nconsole.log("hello");\n```\nAnd inline `code`'
      }

      const result = CommentFormatter.formatSyncedComment(
        commentWithCode,
        mockGitHubClient,
        1,
        mockCommentSyncOptions
      )

      expect(result).toContain('```javascript')
      expect(result).toContain('console.log("hello");')
      expect(result).toContain('`code`')
    })

    it('should escape @mentions and issue references', () => {
      const commentWithMentions: Comment = {
        ...mockComment,
        body: 'Hey @username, this relates to #123'
      }

      const result = CommentFormatter.formatSyncedComment(
        commentWithMentions,
        mockGitHubClient,
        1,
        mockCommentSyncOptions
      )

      expect(result).toContain('\\@username')
      expect(result).toContain('\\#123')
    })
  })

  describe('isCommentSynced', () => {
    it('should detect synced comments', () => {
      const syncedComment = '**💬 Comment by @user on GitHub** Some content'
      expect(CommentFormatter.isCommentSynced(syncedComment)).toBe(true)
    })

    it('should detect non-synced comments', () => {
      const regularComment = 'This is just a regular comment'
      expect(CommentFormatter.isCommentSynced(regularComment)).toBe(false)
    })
  })

  describe('extractOriginalCommentId', () => {
    it('should extract GitHub comment ID', () => {
      const syncedComment = 'Content with issuecomment-456 in URL'
      expect(CommentFormatter.extractOriginalCommentId(syncedComment)).toBe(456)
    })

    it('should extract GitLab note ID', () => {
      const syncedComment = 'Content with note_789 in URL'
      expect(CommentFormatter.extractOriginalCommentId(syncedComment)).toBe(789)
    })

    it('should return null for no ID found', () => {
      const syncedComment = 'Content without any ID'
      expect(
        CommentFormatter.extractOriginalCommentId(syncedComment)
      ).toBeNull()
    })
  })

  describe('needsCommentUpdate', () => {
    it('should detect when update is needed', () => {
      const sourceComment: Comment = {
        id: 123,
        body: 'Updated content',
        author: 'user',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:00:00Z'
      }

      const targetComment: Comment = {
        id: 456,
        body: '> Original content\n---\n*Synced from GitHub*',
        author: 'user',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }

      expect(
        CommentFormatter.needsCommentUpdate(sourceComment, targetComment)
      ).toBe(true)
    })
  })
})

describe('getCommentSyncOptions', () => {
  it('should return default options when config is empty', () => {
    const config: Config = {
      github: { enabled: true },
      gitlab: { enabled: true }
    }

    const options = getCommentSyncOptions(config, 'issues')

    expect(options.enabled).toBe(false)
    expect(options.attribution.format).toBe('quoted')
    expect(options.handleUpdates).toBe(true)
  })

  it('should use config values when provided', () => {
    const config: Config = {
      github: {
        enabled: true,
        sync: {
          branches: {
            enabled: true,
            protected: true,
            pattern: '*',
            historySync: {
              enabled: true,
              strategy: 'merge-timelines',
              createMergeCommits: true,
              mergeMessage: 'Sync: Merge timeline from {source} to {target}'
            }
          },
          pullRequests: {
            enabled: true,
            autoMerge: false,
            labels: [],
            comments: {
              enabled: false,
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
          },
          issues: {
            enabled: true,
            labels: [],
            comments: {
              enabled: true,
              attribution: {
                includeAuthor: false,
                includeTimestamp: false,
                includeSourceLink: true,
                format: 'inline'
              },
              handleUpdates: false,
              preserveFormatting: false,
              syncReplies: false
            }
          },
          releases: {
            enabled: true,
            divergentCommitStrategy: 'skip',
            latestReleaseStrategy: 'point-to-latest',
            skipPreReleases: false,
            pattern: '*',
            includeAssets: true
          },
          tags: {
            enabled: true,
            divergentCommitStrategy: 'skip',
            pattern: '*'
          }
        }
      },
      gitlab: { enabled: true }
    }

    const options = getCommentSyncOptions(config, 'issues')

    expect(options.enabled).toBe(true)
    expect(options.attribution.includeAuthor).toBe(false)
    expect(options.attribution.format).toBe('inline')
    expect(options.handleUpdates).toBe(false)
  })
})
