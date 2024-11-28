// src/types/common.ts
export interface Repository {
  owner: string
  repo: string
}

export interface Branch {
  name: string
  sha: string
  protected: boolean
}

export interface PullRequest {
  title: string
  description: string
  sourceBranch: string
  targetBranch: string
  labels: string[]
}

export interface Issue {
  title: string
  body: string
  labels: string[]
  number: number
  state: 'open' | 'closed'
}

export interface Release {
  tag: string
  name: string
  body: string
  draft: boolean
  prerelease: boolean
}

export interface Comment {
  body: string
  createdAt: string
  author: string
}
