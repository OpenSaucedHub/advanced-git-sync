import { GitHubClient } from '../github';
import { GitLabClient } from '../gitlab';
import { IssueComparison, CommentComparison, Issue, Comment } from '../types';
export declare function compareIssues(sourceIssues: Issue[], targetIssues: Issue[]): IssueComparison[];
export declare function compareComments(sourceComments: Comment[], targetComments: Comment[]): CommentComparison[];
export declare function syncIssues(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<void>;
