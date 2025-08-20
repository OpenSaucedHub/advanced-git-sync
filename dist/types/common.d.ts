export interface Repository {
    owner: string;
    repo: string;
}
export interface Comment {
    id?: number;
    body: string;
    author?: string;
    createdAt?: string;
    updatedAt?: string;
    sourceUrl?: string;
    isReply?: boolean;
    parentCommentId?: number;
}
export interface PullRequest {
    id?: number;
    number?: number;
    title: string;
    description: string;
    sourceBranch: string;
    targetBranch: string;
    labels: string[];
    state?: 'open' | 'closed' | 'merged';
    comments?: Comment[];
    reviews?: Review[];
}
export interface Review {
    id: number;
    state: 'approved' | 'changes_requested' | 'commented';
    body: string;
    author: string;
    createdAt: string;
}
export interface Tag {
    name: string;
    createdAt: string;
    commitSha: string;
}
export interface ReleaseAsset {
    name: string;
    url: string;
    size: number;
    contentType: string;
}
export interface Release {
    id: string;
    tag: string;
    name: string;
    body: string;
    draft: boolean;
    prerelease: boolean;
    createdAt: string;
    publishedAt: string | null;
    commitSha?: string;
    assets: ReleaseAsset[];
}
export interface Issue {
    title: string;
    body: string;
    number?: number;
    state?: 'open' | 'closed';
    labels: string[];
    comments?: Comment[];
}
export interface IssueComparison {
    sourceIssue: Issue;
    targetIssue?: Issue;
    action: 'create' | 'update' | 'skip';
}
export interface Branch {
    name: string;
    sha: string;
    protected: boolean;
    lastCommitDate?: string;
}
export interface BranchComparison {
    name: string;
    sourceCommit: string;
    targetCommit?: string;
    sourceCommitDate?: string;
    targetCommitDate?: string;
    action: 'create' | 'update' | 'skip' | 'delete';
    protected: boolean;
    reason?: string;
}
export interface BranchFilterOptions {
    includeProtected?: boolean;
    pattern?: string;
}
