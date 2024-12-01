import { Tag, Config, Repository } from '@/src/types';
export declare class TagHelper {
    private gitlab;
    private repo;
    private config;
    constructor(gitlab: any, repo: Repository, config: Config);
    private get projectPath();
    syncTags(): Promise<Tag[]>;
    createTag(tag: Tag): Promise<void>;
    updateTag(tag: Tag): Promise<void>;
}
