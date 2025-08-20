import { Branch, BranchComparison } from '../types';
import { GitHubClient } from '../structures/github/GitHub';
import { GitLabClient } from '../structures/gitlab/GitLab';
export declare function compareBranches(sourceBranches: Branch[], targetBranches: Branch[]): BranchComparison[];
/**
 * Improved bidirectional sync that avoids race conditions by fetching fresh data
 * and using intelligent merge logic
 */
export declare function syncBranchesBidirectional(githubClient: GitHubClient, gitlabClient: GitLabClient): Promise<void>;
export declare function syncBranches(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<void>;
