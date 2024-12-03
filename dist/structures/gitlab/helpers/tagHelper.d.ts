import { Tag, Config } from '@/src/types';
export declare class TagHelper {
    private gitlab;
    private config;
    private getProjectId;
    constructor(gitlab: any, config: Config, getProjectId: () => Promise<number>);
    syncTags(): Promise<Tag[]>;
    createTag(tag: Tag): Promise<void>;
    updateTag(tag: Tag): Promise<void>;
}
