import { Release, ReleaseAsset, Config, Repository } from '@/src/types';
export declare class ReleaseHelper {
    private gitlab;
    private repo;
    private config;
    constructor(gitlab: any, repo: Repository, config: Config);
    private get projectPath();
    syncReleases(): Promise<Release[]>;
    createRelease(release: Release): Promise<void>;
    updateRelease(release: Release): Promise<void>;
    downloadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<Buffer>;
    uploadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<void>;
}
