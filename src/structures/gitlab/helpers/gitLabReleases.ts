import { Release, ReleaseAsset, Config } from '@/src/types'
import * as core from '@actions/core'

export class gitlabReleaseHelper {
  constructor(
    private gitlab: any,
    private config: Config,
    private getProjectId: () => Promise<number>
  ) {}

  async syncReleases(): Promise<Release[]> {
    if (!this.config.github.sync?.releases.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷️ Fetching GitLab ProjectReleases...\x1b[0m')

      const projectId = await this.getProjectId()
      const releases = await this.gitlab.ProjectReleases.all(projectId)

      const processedReleases = releases.map(
        (release: {
          tag_name: string
          name: string
          description: string
          created_at: string
          released_at: string
          assets: {
            links?: { name: string; url: string; link_type?: string }[]
          }
        }) => ({
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
    try {
      const projectId = await this.getProjectId()
      const createdRelease = await this.gitlab.ProjectReleases.create(
        projectId,
        {
          tag_name: release.tag,
          name: release.name,
          description: release.body,
          ref: release.tag
        }
      )

      release.id = createdRelease.tag_name
    } catch (error) {
      throw new Error(
        `Failed to create release ${release.tag}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async updateRelease(release: Release): Promise<void> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.ProjectReleases.update(projectId, release.tag, {
        name: release.name,
        description: release.body
      })
    } catch (error) {
      throw new Error(
        `Failed to update release ${release.tag}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async uploadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<void> {
    try {
      const projectId = await this.getProjectId()
      await this.gitlab.ReleaseLinks.create(projectId, releaseId, {
        name: asset.name,
        url: asset.url,
        link_type: asset.contentType
      })
    } catch (error) {
      throw new Error(
        `Failed to upload asset ${asset.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async downloadReleaseAsset(
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
}
