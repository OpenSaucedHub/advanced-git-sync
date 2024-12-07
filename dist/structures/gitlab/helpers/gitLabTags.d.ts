import { Tag, Config } from '@/src/types';
export declare class gitlabTagHelper {
    private gitlab;
    private config;
    private getProjectId;
    private repoPath;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    private getRepoPathFromConfig;
    syncTags(): Promise<Tag[]>;
    createTag(tag: Tag): Promise<void>;
    updateTag(tag: Tag): Promise<void>;
}
