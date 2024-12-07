import { Repository, Config, Release, ReleaseAsset } from '@/src/types';
export declare class githubReleaseHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    syncReleases(): Promise<Release[]>;
    createRelease(release: Release): Promise<void>;
    updateRelease(release: Release): Promise<void>;
    downloadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<Buffer>;
    uploadReleaseAsset(releaseId: string, asset: ReleaseAsset, content: Buffer): Promise<void>;
}
