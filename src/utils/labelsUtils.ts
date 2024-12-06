// src/utils/labelHelper.ts

import { Config } from '../types'

export class LabelHelper {
  /**
   * Normalizes label configuration from config
   */
  static normalizeConfigLabels(
    labels: string | string[] | undefined
  ): string[] {
    if (!labels) return []
    return Array.isArray(labels) ? labels : [labels]
  }

  /**
   * Normalizes GitHub labels to a standard format
   * GitHub labels come as an array of objects: { name: string, ... }
   */
  static normalizeGitHubLabels(labels: Array<{ name: string }>): string[] {
    return labels.map(label => label.name)
  }

  /**
   * Normalizes GitLab labels to a standard format
   * GitLab labels come as either string[] or comma-separated string
   */
  static normalizeGitLabLabels(
    labels: string[] | string | undefined
  ): string[] {
    if (!labels) return []
    if (Array.isArray(labels)) return labels
    // Only split if contains commas, otherwise treat as single label
    return labels.includes(',')
      ? labels.split(',').map(label => label.trim())
      : [labels.trim()]
  }

  /**
   * Combines source labels with config labels and normalizes them
   */
  static combineLabels(
    sourceLabels: string[] | Array<{ name: string }> | string | undefined,
    config: Config,
    platform: 'github' | 'gitlab'
  ): string[] {
    // Normalize source labels based on platform
    const normalizedSourceLabels = Array.isArray(sourceLabels)
      ? platform === 'github'
        ? this.normalizeGitHubLabels(sourceLabels as Array<{ name: string }>)
        : (sourceLabels as string[])
      : this.normalizeGitLabLabels(sourceLabels)

    // Get config labels
    const configLabels =
      platform === 'github'
        ? this.normalizeConfigLabels(config.gitlab.sync?.pullRequests.labels)
        : this.normalizeConfigLabels(config.github.sync?.pullRequests.labels)

    // Combine and deduplicate
    return [...new Set([...normalizedSourceLabels, ...configLabels])]
  }

  /**
   * Formats labels for GitLab API (comma-separated string)
   */
  static formatForGitLab(labels: string[]): string {
    return labels.join(',')
  }

  /**
   * Checks if two label sets are equivalent
   */
  static areLabelsEqual(labels1: string[], labels2: string[]): boolean {
    const normalized1 = labels1.map(l => l.trim()).sort()
    const normalized2 = labels2.map(l => l.trim()).sort()
    return JSON.stringify(normalized1) === JSON.stringify(normalized2)
  }
}
