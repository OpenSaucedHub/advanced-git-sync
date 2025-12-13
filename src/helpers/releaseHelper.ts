import * as core from '@actions/core'
import { Repository, Config, Release, ReleaseAsset } from '../../types'
import { GitHub } from '@actions/github/lib/utils'
import { Gitlab } from '@gitbeaker/core'

type PlatformClient = InstanceType<typeof GitHub> | Gitlab
type PlatformType = 'github' | 'gitlab'

export class ReleaseHelper {
  constructor(
    private client: PlatformClient,
    private platform: PlatformType,
    private repo: Repository,
    private config: Config,
    private getProjectId?: () => Promise<number>
  ) {}

  async syncReleases(): Promise<Release[]> {
    if (this.platform === 'github') {
      return this.syncGitHubReleases()
    } else {
      return this.syncGitLabReleases()
    }
  }

  private async syncGitHubReleases(): Promise<Release[]> {
    if (!this.config.gitlab.sync?.releases.enabled) {
      return []
    }

    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      core.info('\x1b[36m🏷️ Fetching GitHub Releases...\x1b[0m')

      const { data: releases } = await octokit.rest.repos.listReleases({
        ...this.repo
      })

      const processedReleases: Release[] = releases.map(
        (release: {
          id: number
          tag_name: string
          name?: string | null
          body?: string | null
          draft: boolean
          prerelease: boolean
          created_at: string
          published_at?: string | null
          assets: Array<{
            name: string
            browser_download_url: string
            size: number
            content_type: string
          }>
        }): Release => ({
          id: release.id.toString(),
          tag: release.tag_name,
          name: release.name || release.tag_name,
          body: release.body || '',
          draft: release.draft,
          prerelease: release.prerelease,
          createdAt: release.created_at,
          publishedAt: release.published_at || release.created_at,
          assets: release.assets.map(
            (asset): ReleaseAsset => ({
              name: asset.name,
              url: asset.browser_download_url,
              size: asset.size,
              contentType: asset.content_type
            })
          )
        })
      )

      core.info(
        `\x1b[32m✓ Releases Fetched: ${processedReleases.length} releases\x1b[0m`
      )
      return processedReleases
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitHub Releases: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  private async syncGitLabReleases(): Promise<Release[]> {
    if (!this.config.github.sync?.releases.enabled) {
      return []
    }

    try {
      const gitlab = this.client as Gitlab
      core.info('\x1b[36m🏷️ Fetching GitLab ProjectReleases...\x1b[0m')

      const projectId = await this.getProjectId!()
      const releases = await gitlab.ProjectReleases.all(projectId)

      const processedReleases = releases.map(
        (release: any): Release => ({
          id: release.tag_name,
          tag: release.tag_name,
          name: release.name || release.tag_name,
          body: release.description || '',
          draft: false,
          prerelease: false,
          createdAt: release.created_at,
          publishedAt: release.released_at,
          assets: (release.assets.links ?? []).map(
            (asset: { name: string; url: string; link_type?: string }) => ({
              name: asset.name,
              url: asset.url,
              size: 0,
              contentType: asset.link_type || 'application/octet-stream'
            })
          )
        })
      )

      core.info(
        `\x1b[32m✓ ProjectReleases Fetched: ${processedReleases.length} releases\x1b[0m`
      )
      return processedReleases
    } catch (error) {
      core.warning(
        `\x1b[31m❌ Failed to Fetch GitLab ProjectReleases: ${error instanceof Error ? error.message : String(error)}\x1b[0m`
      )
      return []
    }
  }

  async createRelease(release: Release): Promise<void> {
    if (this.platform === 'github') {
      return this.createGitHubRelease(release)
    } else {
      return this.createGitLabRelease(release)
    }
  }

  private async createGitHubRelease(release: Release): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const { data: createdRelease } = await octokit.rest.repos.createRelease({
        ...this.repo,
        tag_name: release.tag,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease
      })

      release.id = createdRelease.id.toString()
    } catch (error) {
      throw new Error(
        `Failed to create release ${release.tag}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  private async createGitLabRelease(release: Release): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()

      let tagExists = false
      try {
        await gitlab.Tags.show(projectId, release.tag)
        tagExists = true
      } catch (error) {
        core.debug(`Tag ${release.tag} does not exist in GitLab repository`)
      }

      const releaseParams: any = {
        tag_name: release.tag,
        name: release.name,
        description: release.body
      }

      if (tagExists) {
        releaseParams.ref = release.tag
      } else {
        releaseParams.ref = 'main'
      }

      const createdRelease = await gitlab.ProjectReleases.create(
        projectId,
        releaseParams
      )

      release.id = createdRelease.tag_name
    } catch (error) {
      throw new Error(
        `Failed to create release ${release.tag}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updateRelease(release: Release): Promise<void> {
    if (this.platform === 'github') {
      return this.updateGitHubRelease(release)
    } else {
      return this.updateGitLabRelease(release)
    }
  }

  private async updateGitHubRelease(release: Release): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const { data: existingRelease } =
        await octokit.rest.repos.getReleaseByTag({
          ...this.repo,
          tag: release.tag
        })

      await octokit.rest.repos.updateRelease({
        ...this.repo,
        release_id: existingRelease.id,
        tag_name: release.tag,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease
      })
    } catch (error) {
      throw new Error(
        `Failed to update release ${release.tag}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  private async updateGitLabRelease(release: Release): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      await gitlab.ProjectReleases.edit(projectId, release.tag, {
        name: release.name,
        description: release.body
      })
    } catch (error) {
      throw new Error(
        `Failed to update release ${release.tag}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async downloadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<Buffer> {
    if (this.platform === 'github') {
      return this.downloadGitHubReleaseAsset(releaseId, asset)
    } else {
      return this.downloadGitLabReleaseAsset(releaseId, asset)
    }
  }

  private async downloadGitHubReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<Buffer> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/releases/assets/{asset_id}',
        {
          ...this.repo,
          asset_id: parseInt(releaseId),
          headers: {
            Accept: 'application/octet-stream'
          }
        }
      )

      return Buffer.from(response.data as unknown as Uint8Array)
    } catch (error) {
      throw new Error(
        `Failed to download asset ${asset.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  private async downloadGitLabReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<Buffer> {
    try {
      const response = await fetch(asset.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      throw new Error(
        `Failed to download asset ${asset.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async uploadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset,
    content?: Buffer
  ): Promise<void> {
    if (this.platform === 'github') {
      if (!content) {
        throw new Error('Content is required for GitHub asset upload')
      }
      return this.uploadGitHubReleaseAsset(releaseId, asset, content)
    } else {
      return this.uploadGitLabReleaseAsset(releaseId, asset)
    }
  }

  private async uploadGitHubReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset,
    content: Buffer
  ): Promise<void> {
    try {
      const octokit = this.client as InstanceType<typeof GitHub>
      await octokit.rest.repos.uploadReleaseAsset({
        ...this.repo,
        release_id: parseInt(releaseId),
        name: asset.name,
        data: content.toString('base64'),
        headers: {
          'content-type': asset.contentType,
          'content-length': asset.size
        }
      })
    } catch (error) {
      throw new Error(
        `Failed to upload asset ${asset.name}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  private async uploadGitLabReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<void> {
    try {
      const gitlab = this.client as Gitlab
      const projectId = await this.getProjectId!()
      // GitLab ReleaseLinks.create expects: projectId, tagName, name, url, options
      await gitlab.ReleaseLinks.create(
        projectId,
        releaseId,
        asset.name,
        asset.url,
        {
          linkType: asset.contentType
        }
      )
    } catch (error) {
      throw new Error(
        `Failed to upload asset ${asset.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
