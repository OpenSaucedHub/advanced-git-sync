import { Gitlab } from '@gitbeaker/rest'
import { SyncConfig } from '../types'

export class GitLabService {
  private client: InstanceType<typeof Gitlab>

  constructor(config: SyncConfig) {
    this.client = new Gitlab({
      host: config.gitlab.url,
      token: config.gitlab.token
    })
  }

  async syncPullRequest(prData: {
    title: string
    description: string
    sourceBranch: string
    targetBranch: string
    projectId: string | number
  }) {
    return this.client.MergeRequests.create(
      prData.projectId,
      prData.sourceBranch,
      prData.targetBranch,
      prData.title,
      {
        description: prData.description
      }
    )
  }

  async syncIssue(issueData: {
    title: string
    description: string
    projectId: string | number
    labels: string[]
  }) {
    return this.client.Issues.create(issueData.projectId, issueData.title, {
      description: issueData.description,
      labels: issueData.labels.join(',')
    })
  }
}
