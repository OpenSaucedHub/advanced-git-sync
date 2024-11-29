import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
import { Branch, BranchComparison } from '../types';
export declare function compareBranches(sourceBranches: Branch[], targetBranches: Branch[]): BranchComparison[];
export declare function syncBranches(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<void>;
