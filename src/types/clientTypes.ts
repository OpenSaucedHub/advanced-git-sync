import { Config, Repository, Branch, BranchFilterOptions } from '.'

export interface PermissionCheck {
  feature: string
  check: () => Promise<unknown>
  warningMessage: string
}

export interface IClient {
  config: Config
  repo: Repository
  validateAccess(): Promise<void>
  fetchBranches(filterOptions?: BranchFilterOptions): Promise<Branch[]>
  createBranch(name: string, commitSha: string): Promise<void>
  updateBranch(name: string, commitSha: string): Promise<void>
  commitExists(commitSha: string): Promise<boolean>
  getRecentCommits(branchName: string, limit: number): Promise<any[]>
  getCommitDetails(
    commitSha: string
  ): Promise<{ sha: string; date: string } | null>
}
