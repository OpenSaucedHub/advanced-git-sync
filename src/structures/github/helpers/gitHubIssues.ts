import * as core from '@actions/core'
import { Repository, Config, Issue } from '@/src/types'
import { LabelHelper } from '@/src/utils/labelsUtils'

export class githubIssueHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async syncIssues(): Promise<Issue[]> {
    if (!this.config.gitlab.sync?.issues.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m❗ Fetching GitHub Issues...\x1b[0m')

      const { data: issues } = await this.octokit.rest.issues.listForRepo({
        ...this.repo,
        state: 'all',
        per_page: 100
      })

      const processedIssues: Issue[] = issues
        .filter((issue: { pull_request?: any }) => !issue.pull_request)
        .map(
          (issue: {
            title: string
            body: string | null
            labels: Array<{ name: string }>
            number: number
            state: string
            pull_request?: any
          }): Issue => ({
            title: issue.title,
            body: issue.body || '',
            labels: LabelHelper.combineLabels(
              issue.labels,
              this.config,
              'github'
            ),
            number: issue.number,
            state: issue.state as 'open' | 'closed'
          })
        )

      core.info(
        `\x1b[32m✓ Issues Fetched: ${processedIssues.length} total issues\x1b[0m`
      )
      return processedIssues
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Issues: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createIssue(issue: Issue): Promise<void> {
    try {
      await this.octokit.rest.issues.create({
        ...this.repo,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        state: issue.state
      })
    } catch (error) {
      throw new Error(
        `Failed to create issue "${issue.title}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updateIssue(issueNumber: number, issue: Issue): Promise<void> {
    try {
      // Update an existing issue with the provided details
      await this.octokit.rest.issues.update({
        ...this.repo,
        issue_number: issueNumber,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        state: issue.state
      })
    } catch (error) {
      // Throw a descriptive error if issue update fails
      throw new Error(
        `Failed to update issue #${issueNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
