import { GitHubClient } from '../structures/github/GitHub';
import { IssueComparison, CommentComparison, Issue, Comment } from '../types';
import { GitLabClient } from '../structures/gitlab/GitLab';
export declare function compareIssues(sourceIssues: Issue[], targetIssues: Issue[]): IssueComparison[];
export declare function prepareSourceLink(sourceClient: GitHubClient | GitLabClient, sourceIssue: Issue): string;
export declare function compareComments(sourceComments: Comment[], targetComments: Comment[]): CommentComparison[];
export declare function syncIssues(source: GitHubClient | GitLabClient, target: GitHubClient | GitLabClient): Promise<void>;
