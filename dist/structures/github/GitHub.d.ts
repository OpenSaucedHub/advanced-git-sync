import { Repository, Config, Issue, Comment, PullRequest, Release, ReleaseAsset, Tag } from '@/src/types';
import { BaseClient } from '../baseClient';
import { branchHelper, permHelper, pullRequestHelper, issueHelper, releaseHelper, tagsHelper } from './helpers';
export declare class GitHubClient extends BaseClient {
    private octokit;
    branches: branchHelper;
    permissions: permHelper;
    pullRequest: pullRequestHelper;
    issue: issueHelper;
    release: releaseHelper;
    tags: tagsHelper;
    constructor(config: Config, repo?: Repository);
    getRepoInfo(): {
        owner: string;
        repo: string;
        url: string;
    };
    validateAccess(): Promise<void>;
    syncBranches(): Promise<import("@/src/types").Branch[]>;
    createBranch(name: string, commitSha: string): Promise<void>;
    updateBranch(name: string, commitSha: string): Promise<void>;
    syncPullRequests(): Promise<PullRequest[]>;
    createPullRequest(pr: PullRequest): Promise<void>;
    updatePullRequest(number: number, pr: PullRequest): Promise<void>;
    closePullRequest(number: number): Promise<void>;
    syncIssues(): Promise<Issue[]>;
    getIssueComments(issueNumber: number): Promise<Comment[]>;
    createIssue(issue: Issue): Promise<void>;
    updateIssue(issueNumber: number, issue: Issue): Promise<void>;
    createIssueComment(issueNumber: number, comment: Comment): Promise<void>;
    syncReleases(): Promise<Release[]>;
    createRelease(release: Release): Promise<void>;
    updateRelease(release: Release): Promise<void>;
    downloadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<Buffer>;
    uploadReleaseAsset(releaseId: string, asset: ReleaseAsset, content: Buffer): Promise<void>;
    syncTags(): Promise<Tag[]>;
    createTag(tag: Tag): Promise<void>;
    updateTag(tag: Tag): Promise<void>;
}
