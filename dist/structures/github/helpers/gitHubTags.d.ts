import { Repository, Config, Tag } from '@/src/types';
export declare class tagsHelper {
    private octokit;
    private repo;
    private config;
    constructor(octokit: any, repo: Repository, config: Config);
    syncTags(): Promise<Tag[]>;
    createTag(tag: Tag): Promise<void>;
    updateTag(tag: Tag): Promise<void>;
}
