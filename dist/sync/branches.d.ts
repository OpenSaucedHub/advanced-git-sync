import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
/**
 * Synchronizes branches between source and target Git providers (GitHub/GitLab).
 * This function compares branches between source and target repositories and identifies
 * branches that exist in source but not in target.
 *
 * @param source - The source client instance (GitHub or GitLab) to sync branches from
 * @param target - The target client instance (GitHub or GitLab) to sync branches to
 *
 * @returns Promise resolving to an array of branches that need to be synchronized.
 * Returns empty array if synchronization fails.
 *
 * @throws Will not throw errors directly, but logs error messages using core.error
 *
 */
export declare function syncBranches(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<import("../types").Branch[]>;
