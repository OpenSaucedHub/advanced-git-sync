// src/types/common.ts
export interface Repository {
  owner: string
  repo: string
  description?: string
}

export interface Comment {
  id?: number
  body: string
  author?: string
  createdAt?: string
  updatedAt?: string
  sourceUrl?: string
  isReply?: boolean
  parentCommentId?: number
}

// prs interface
export interface PullRequest {
  id?: number
  number?: number
  title: string
  description: string
  sourceBranch: string
  targetBranch: string
  labels: string[]
  state?: 'open' | 'closed' | 'merged'
  comments?: Comment[]
  reviews?: Review[]
}

export interface Review {
  id: number
  state: 'approved' | 'changes_requested' | 'commented'
  body: string
  author: string
  createdAt: string
}

// tags and releases interface
export interface Tag {
  name: string
  createdAt: string
  commitSha: string
}

export interface ReleaseAsset {
  name: string
  url: string
  size: number
  contentType: string
}

export interface Release {
  id: string
  tag: string
  name: string
  body: string
  draft: boolean
  prerelease: boolean
  createdAt: string
  publishedAt: string | null
  commitSha?: string
  assets: ReleaseAsset[]
}

// issues interface
export interface Issue {
  title: string
  body: string
  number?: number
  state?: 'open' | 'closed'
  labels: string[]
  comments?: Comment[]
}

export interface IssueComparison {
  sourceIssue: Issue
  targetIssue?: Issue
  action: 'create' | 'update' | 'skip'
}

// branches interface
export interface Branch {
  name: string
  sha: string
  protected: boolean
  lastCommitDate?: string // ISO timestamp of the last commit
}

export interface BranchComparison {
  name: string
  sourceCommit: string
  targetCommit?: string
  sourceCommitDate?: string
  targetCommitDate?: string
  action: 'create' | 'update' | 'skip' | 'delete'
  protected: boolean
  reason?: string // Reason for the action (for debugging/logging)
}

// Branch filter options for both GitHub and GitLab
export interface BranchFilterOptions {
  includeProtected?: boolean
  pattern?: string
}
