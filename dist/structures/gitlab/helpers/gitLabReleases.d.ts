import { Release, ReleaseAsset, Config } from '@/src/types';
export declare class gitlabReleaseHelper {
    private gitlab;
    private config;
    private getProjectId;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    syncReleases(): Promise<Release[]>;
    createRelease(release: Release): Promise<void>;
    updateRelease(release: Release): Promise<void>;
    uploadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<void>;
    downloadReleaseAsset(releaseId: string, asset: ReleaseAsset): Promise<Buffer>;
}
