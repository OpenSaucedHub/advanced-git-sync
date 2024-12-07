import { Repository, Config, Issue, Comment, PullRequest, Release, ReleaseAsset, Tag, IClient } from '@/src/types';
import { githubBranchHelper, pullRequestHelper, githubIssueHelper, githubReleaseHelper, tagsHelper, githubPermsHelper } from './helpers';
export declare class GitHubClient implements IClient {
    config: Config;
    repo: Repository;
    private octokit;
    branches: githubBranchHelper;
    pullRequest: pullRequestHelper;
    issue: githubIssueHelper;
    release: githubReleaseHelper;
    tags: tagsHelper;
    perms: githubPermsHelper;
    constructor(config: Config, repo: Repository);
    getRepoInfo(): {
        url: string;
        owner: string;
        repo: string;
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
