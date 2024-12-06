import { Branch, BranchComparison } from '../types';
import { GitHubClient } from '../structures/github/GitHub';
import { GitLabClient } from '../structures/gitlab/GitLab';
export declare function compareBranches(sourceBranches: Branch[], targetBranches: Branch[]): BranchComparison[];
export declare function syncBranches(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<void>;
