// src/structures/github/helpers/releaseHelper.ts
import * as core from '@actions/core'
import { Repository, Config, Release, ReleaseAsset } from '@/src/types'

export class githubReleaseHelper {
  constructor(
    private octokit: any,
    private repo: Repository,
    private config: Config
  ) {}

  async syncReleases(): Promise<Release[]> {
    if (!this.config.gitlab.sync?.releases.enabled) {
      return []
    }

    try {
      core.info('\x1b[36m🏷️ Fetching GitHub Releases...\x1b[0m')

      const { data: releases } = await this.octokit.rest.repos.listReleases({
        ...this.repo
      })

      const processedReleases: Release[] = releases.map(
        (release: {
          id: number
          tag_name: string
          name: string
          body: string
          draft: boolean
          prerelease: boolean
          created_at: string
          published_at: string
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
          publishedAt: release.published_at,
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

  async createRelease(release: Release): Promise<void> {
    try {
      const { data: createdRelease } =
        await this.octokit.rest.repos.createRelease({
          ...this.repo,
          tag_name: release.tag,
          name: release.name,
          body: release.body,
          draft: release.draft,
          prerelease: release.prerelease
        })

      // Store the created release ID for asset upload
      release.id = createdRelease.id.toString()
    } catch (error) {
      throw new Error(
        `Failed to create release ${release.tag}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async updateRelease(release: Release): Promise<void> {
    try {
      const { data: existingRelease } =
        await this.octokit.rest.repos.getReleaseByTag({
          ...this.repo,
          tag: release.tag
        })

      await this.octokit.rest.repos.updateRelease({
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

  async downloadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset
  ): Promise<Buffer> {
    try {
      const response = await this.octokit.request(
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

  async uploadReleaseAsset(
    releaseId: string,
    asset: ReleaseAsset,
    content: Buffer
  ): Promise<void> {
    try {
      await this.octokit.rest.repos.uploadReleaseAsset({
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
}
