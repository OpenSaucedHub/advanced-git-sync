import { Release, ReleaseAsset, Config, Repository } from '@/src/types';
export declare class ReleaseHelper {
    private gitlab;
    private repo;
    private config;
    private getProjectId;
    constructor(gitlab: any, repo: Repository, config: Config, getProjectId: () => Promise<number>);
    syncReleases(): Promise<Release[]>;
    createRelease(release: Release): Promise<void>;
    updateRelease(release: Release): Promise<void>;
    uploadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<void>;
    downloadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<Buffer>;
}
