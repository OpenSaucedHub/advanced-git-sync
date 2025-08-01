import { z } from 'zod';
export declare const BranchConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    protected: z.ZodBoolean;
    pattern: z.ZodString;
}, z.core.$strip>;
export declare const PRConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    autoMerge: z.ZodBoolean;
    labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
}, z.core.$strip>;
export declare const IssueConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    syncComments: z.ZodBoolean;
    labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
}, z.core.$strip>;
export declare const SyncConfigSchema: z.ZodObject<{
    branches: z.ZodObject<{
        enabled: z.ZodBoolean;
        protected: z.ZodBoolean;
        pattern: z.ZodString;
    }, z.core.$strip>;
    pullRequests: z.ZodObject<{
        enabled: z.ZodBoolean;
        autoMerge: z.ZodBoolean;
        labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    }, z.core.$strip>;
    issues: z.ZodObject<{
        enabled: z.ZodBoolean;
        syncComments: z.ZodBoolean;
        labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    }, z.core.$strip>;
    releases: z.ZodObject<{
        enabled: z.ZodBoolean;
    }, z.core.$strip>;
    tags: z.ZodObject<{
        enabled: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const GitlabConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    host: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    repo: z.ZodOptional<z.ZodString>;
    sync: z.ZodOptional<z.ZodObject<{
        branches: z.ZodObject<{
            enabled: z.ZodBoolean;
            protected: z.ZodBoolean;
            pattern: z.ZodString;
        }, z.core.$strip>;
        pullRequests: z.ZodObject<{
            enabled: z.ZodBoolean;
            autoMerge: z.ZodBoolean;
            labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        }, z.core.$strip>;
        issues: z.ZodObject<{
            enabled: z.ZodBoolean;
            syncComments: z.ZodBoolean;
            labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        }, z.core.$strip>;
        releases: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, z.core.$strip>;
        tags: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const GithubConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    token: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    repo: z.ZodOptional<z.ZodString>;
    sync: z.ZodOptional<z.ZodObject<{
        branches: z.ZodObject<{
            enabled: z.ZodBoolean;
            protected: z.ZodBoolean;
            pattern: z.ZodString;
        }, z.core.$strip>;
        pullRequests: z.ZodObject<{
            enabled: z.ZodBoolean;
            autoMerge: z.ZodBoolean;
            labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        }, z.core.$strip>;
        issues: z.ZodObject<{
            enabled: z.ZodBoolean;
            syncComments: z.ZodBoolean;
            labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        }, z.core.$strip>;
        releases: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, z.core.$strip>;
        tags: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ConfigSchema: z.ZodObject<{
    gitlab: z.ZodObject<{
        enabled: z.ZodBoolean;
        projectId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        host: z.ZodOptional<z.ZodString>;
        token: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        repo: z.ZodOptional<z.ZodString>;
        sync: z.ZodOptional<z.ZodObject<{
            branches: z.ZodObject<{
                enabled: z.ZodBoolean;
                protected: z.ZodBoolean;
                pattern: z.ZodString;
            }, z.core.$strip>;
            pullRequests: z.ZodObject<{
                enabled: z.ZodBoolean;
                autoMerge: z.ZodBoolean;
                labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
            }, z.core.$strip>;
            issues: z.ZodObject<{
                enabled: z.ZodBoolean;
                syncComments: z.ZodBoolean;
                labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
            }, z.core.$strip>;
            releases: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, z.core.$strip>;
            tags: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, z.core.$strip>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    github: z.ZodObject<{
        enabled: z.ZodBoolean;
        token: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        repo: z.ZodOptional<z.ZodString>;
        sync: z.ZodOptional<z.ZodObject<{
            branches: z.ZodObject<{
                enabled: z.ZodBoolean;
                protected: z.ZodBoolean;
                pattern: z.ZodString;
            }, z.core.$strip>;
            pullRequests: z.ZodObject<{
                enabled: z.ZodBoolean;
                autoMerge: z.ZodBoolean;
                labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
            }, z.core.$strip>;
            issues: z.ZodObject<{
                enabled: z.ZodBoolean;
                syncComments: z.ZodBoolean;
                labels: z.ZodPipe<z.ZodPipe<z.ZodAny, z.ZodTransform<string | string[], any>>, z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
            }, z.core.$strip>;
            releases: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, z.core.$strip>;
            tags: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, z.core.$strip>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type BranchConfig = z.infer<typeof BranchConfigSchema>;
export type PRConfig = z.infer<typeof PRConfigSchema>;
export type IssueConfig = z.infer<typeof IssueConfigSchema>;
export type SyncConfig = z.infer<typeof SyncConfigSchema>;
export type GitlabConfig = z.infer<typeof GitlabConfigSchema>;
export type GithubConfig = z.infer<typeof GithubConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
