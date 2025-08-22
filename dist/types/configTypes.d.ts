import { z } from 'zod';
export declare const BotBranchConfigSchema: z.ZodObject<{
    strategy: z.ZodDefault<z.ZodEnum<{
        "delete-orphaned": "delete-orphaned";
        sync: "sync";
        skip: "skip";
    }>>;
    patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const BranchConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    protected: z.ZodBoolean;
    pattern: z.ZodString;
    historySync: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        strategy: z.ZodDefault<z.ZodEnum<{
            "merge-timelines": "merge-timelines";
            "skip-diverged": "skip-diverged";
            "force-match": "force-match";
        }>>;
        createMergeCommits: z.ZodDefault<z.ZodBoolean>;
        mergeMessage: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    botBranches: z.ZodOptional<z.ZodObject<{
        strategy: z.ZodDefault<z.ZodEnum<{
            "delete-orphaned": "delete-orphaned";
            sync: "sync";
            skip: "skip";
        }>>;
        patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const PRConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    autoMerge: z.ZodBoolean;
    comments: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        attribution: z.ZodDefault<z.ZodObject<{
            includeAuthor: z.ZodDefault<z.ZodBoolean>;
            includeTimestamp: z.ZodDefault<z.ZodBoolean>;
            includeSourceLink: z.ZodDefault<z.ZodBoolean>;
            format: z.ZodDefault<z.ZodEnum<{
                quoted: "quoted";
                inline: "inline";
                minimal: "minimal";
            }>>;
        }, z.core.$strip>>;
        handleUpdates: z.ZodDefault<z.ZodBoolean>;
        preserveFormatting: z.ZodDefault<z.ZodBoolean>;
        syncReplies: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const IssueConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    comments: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        attribution: z.ZodDefault<z.ZodObject<{
            includeAuthor: z.ZodDefault<z.ZodBoolean>;
            includeTimestamp: z.ZodDefault<z.ZodBoolean>;
            includeSourceLink: z.ZodDefault<z.ZodBoolean>;
            format: z.ZodDefault<z.ZodEnum<{
                quoted: "quoted";
                inline: "inline";
                minimal: "minimal";
            }>>;
        }, z.core.$strip>>;
        handleUpdates: z.ZodDefault<z.ZodBoolean>;
        preserveFormatting: z.ZodDefault<z.ZodBoolean>;
        syncReplies: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ReleaseConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
        skip: "skip";
        "create-anyway": "create-anyway";
        "point-to-latest": "point-to-latest";
    }>>;
    latestReleaseStrategy: z.ZodDefault<z.ZodEnum<{
        skip: "skip";
        "create-anyway": "create-anyway";
        "point-to-latest": "point-to-latest";
    }>>;
    skipPreReleases: z.ZodDefault<z.ZodBoolean>;
    pattern: z.ZodDefault<z.ZodString>;
    includeAssets: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const TagConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
        skip: "skip";
        "create-anyway": "create-anyway";
        "point-to-latest": "point-to-latest";
    }>>;
    pattern: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const SyncConfigSchema: z.ZodObject<{
    branches: z.ZodObject<{
        enabled: z.ZodBoolean;
        protected: z.ZodBoolean;
        pattern: z.ZodString;
        historySync: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            strategy: z.ZodDefault<z.ZodEnum<{
                "merge-timelines": "merge-timelines";
                "skip-diverged": "skip-diverged";
                "force-match": "force-match";
            }>>;
            createMergeCommits: z.ZodDefault<z.ZodBoolean>;
            mergeMessage: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        botBranches: z.ZodOptional<z.ZodObject<{
            strategy: z.ZodDefault<z.ZodEnum<{
                "delete-orphaned": "delete-orphaned";
                sync: "sync";
                skip: "skip";
            }>>;
            patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    pullRequests: z.ZodObject<{
        enabled: z.ZodBoolean;
        autoMerge: z.ZodBoolean;
        comments: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            attribution: z.ZodDefault<z.ZodObject<{
                includeAuthor: z.ZodDefault<z.ZodBoolean>;
                includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                format: z.ZodDefault<z.ZodEnum<{
                    quoted: "quoted";
                    inline: "inline";
                    minimal: "minimal";
                }>>;
            }, z.core.$strip>>;
            handleUpdates: z.ZodDefault<z.ZodBoolean>;
            preserveFormatting: z.ZodDefault<z.ZodBoolean>;
            syncReplies: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    issues: z.ZodObject<{
        enabled: z.ZodBoolean;
        comments: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            attribution: z.ZodDefault<z.ZodObject<{
                includeAuthor: z.ZodDefault<z.ZodBoolean>;
                includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                format: z.ZodDefault<z.ZodEnum<{
                    quoted: "quoted";
                    inline: "inline";
                    minimal: "minimal";
                }>>;
            }, z.core.$strip>>;
            handleUpdates: z.ZodDefault<z.ZodBoolean>;
            preserveFormatting: z.ZodDefault<z.ZodBoolean>;
            syncReplies: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    releases: z.ZodObject<{
        enabled: z.ZodBoolean;
        divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
            skip: "skip";
            "create-anyway": "create-anyway";
            "point-to-latest": "point-to-latest";
        }>>;
        latestReleaseStrategy: z.ZodDefault<z.ZodEnum<{
            skip: "skip";
            "create-anyway": "create-anyway";
            "point-to-latest": "point-to-latest";
        }>>;
        skipPreReleases: z.ZodDefault<z.ZodBoolean>;
        pattern: z.ZodDefault<z.ZodString>;
        includeAssets: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
    tags: z.ZodObject<{
        enabled: z.ZodBoolean;
        divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
            skip: "skip";
            "create-anyway": "create-anyway";
            "point-to-latest": "point-to-latest";
        }>>;
        pattern: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const GitlabConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    host: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    repo: z.ZodOptional<z.ZodString>;
    createIfNotExists: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sync: z.ZodOptional<z.ZodObject<{
        branches: z.ZodObject<{
            enabled: z.ZodBoolean;
            protected: z.ZodBoolean;
            pattern: z.ZodString;
            historySync: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                strategy: z.ZodDefault<z.ZodEnum<{
                    "merge-timelines": "merge-timelines";
                    "skip-diverged": "skip-diverged";
                    "force-match": "force-match";
                }>>;
                createMergeCommits: z.ZodDefault<z.ZodBoolean>;
                mergeMessage: z.ZodDefault<z.ZodString>;
            }, z.core.$strip>>;
            botBranches: z.ZodOptional<z.ZodObject<{
                strategy: z.ZodDefault<z.ZodEnum<{
                    "delete-orphaned": "delete-orphaned";
                    sync: "sync";
                    skip: "skip";
                }>>;
                patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        pullRequests: z.ZodObject<{
            enabled: z.ZodBoolean;
            autoMerge: z.ZodBoolean;
            comments: z.ZodDefault<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                attribution: z.ZodDefault<z.ZodObject<{
                    includeAuthor: z.ZodDefault<z.ZodBoolean>;
                    includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                    includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                    format: z.ZodDefault<z.ZodEnum<{
                        quoted: "quoted";
                        inline: "inline";
                        minimal: "minimal";
                    }>>;
                }, z.core.$strip>>;
                handleUpdates: z.ZodDefault<z.ZodBoolean>;
                preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                syncReplies: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        issues: z.ZodObject<{
            enabled: z.ZodBoolean;
            comments: z.ZodDefault<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                attribution: z.ZodDefault<z.ZodObject<{
                    includeAuthor: z.ZodDefault<z.ZodBoolean>;
                    includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                    includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                    format: z.ZodDefault<z.ZodEnum<{
                        quoted: "quoted";
                        inline: "inline";
                        minimal: "minimal";
                    }>>;
                }, z.core.$strip>>;
                handleUpdates: z.ZodDefault<z.ZodBoolean>;
                preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                syncReplies: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        releases: z.ZodObject<{
            enabled: z.ZodBoolean;
            divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                skip: "skip";
                "create-anyway": "create-anyway";
                "point-to-latest": "point-to-latest";
            }>>;
            latestReleaseStrategy: z.ZodDefault<z.ZodEnum<{
                skip: "skip";
                "create-anyway": "create-anyway";
                "point-to-latest": "point-to-latest";
            }>>;
            skipPreReleases: z.ZodDefault<z.ZodBoolean>;
            pattern: z.ZodDefault<z.ZodString>;
            includeAssets: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
        tags: z.ZodObject<{
            enabled: z.ZodBoolean;
            divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                skip: "skip";
                "create-anyway": "create-anyway";
                "point-to-latest": "point-to-latest";
            }>>;
            pattern: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const GithubConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    token: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    repo: z.ZodOptional<z.ZodString>;
    createIfNotExists: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sync: z.ZodOptional<z.ZodObject<{
        branches: z.ZodObject<{
            enabled: z.ZodBoolean;
            protected: z.ZodBoolean;
            pattern: z.ZodString;
            historySync: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                strategy: z.ZodDefault<z.ZodEnum<{
                    "merge-timelines": "merge-timelines";
                    "skip-diverged": "skip-diverged";
                    "force-match": "force-match";
                }>>;
                createMergeCommits: z.ZodDefault<z.ZodBoolean>;
                mergeMessage: z.ZodDefault<z.ZodString>;
            }, z.core.$strip>>;
            botBranches: z.ZodOptional<z.ZodObject<{
                strategy: z.ZodDefault<z.ZodEnum<{
                    "delete-orphaned": "delete-orphaned";
                    sync: "sync";
                    skip: "skip";
                }>>;
                patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        pullRequests: z.ZodObject<{
            enabled: z.ZodBoolean;
            autoMerge: z.ZodBoolean;
            comments: z.ZodDefault<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                attribution: z.ZodDefault<z.ZodObject<{
                    includeAuthor: z.ZodDefault<z.ZodBoolean>;
                    includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                    includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                    format: z.ZodDefault<z.ZodEnum<{
                        quoted: "quoted";
                        inline: "inline";
                        minimal: "minimal";
                    }>>;
                }, z.core.$strip>>;
                handleUpdates: z.ZodDefault<z.ZodBoolean>;
                preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                syncReplies: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        issues: z.ZodObject<{
            enabled: z.ZodBoolean;
            comments: z.ZodDefault<z.ZodObject<{
                enabled: z.ZodDefault<z.ZodBoolean>;
                attribution: z.ZodDefault<z.ZodObject<{
                    includeAuthor: z.ZodDefault<z.ZodBoolean>;
                    includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                    includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                    format: z.ZodDefault<z.ZodEnum<{
                        quoted: "quoted";
                        inline: "inline";
                        minimal: "minimal";
                    }>>;
                }, z.core.$strip>>;
                handleUpdates: z.ZodDefault<z.ZodBoolean>;
                preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                syncReplies: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        releases: z.ZodObject<{
            enabled: z.ZodBoolean;
            divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                skip: "skip";
                "create-anyway": "create-anyway";
                "point-to-latest": "point-to-latest";
            }>>;
            latestReleaseStrategy: z.ZodDefault<z.ZodEnum<{
                skip: "skip";
                "create-anyway": "create-anyway";
                "point-to-latest": "point-to-latest";
            }>>;
            skipPreReleases: z.ZodDefault<z.ZodBoolean>;
            pattern: z.ZodDefault<z.ZodString>;
            includeAssets: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
        tags: z.ZodObject<{
            enabled: z.ZodBoolean;
            divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                skip: "skip";
                "create-anyway": "create-anyway";
                "point-to-latest": "point-to-latest";
            }>>;
            pattern: z.ZodDefault<z.ZodString>;
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
        createIfNotExists: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        sync: z.ZodOptional<z.ZodObject<{
            branches: z.ZodObject<{
                enabled: z.ZodBoolean;
                protected: z.ZodBoolean;
                pattern: z.ZodString;
                historySync: z.ZodOptional<z.ZodObject<{
                    enabled: z.ZodDefault<z.ZodBoolean>;
                    strategy: z.ZodDefault<z.ZodEnum<{
                        "merge-timelines": "merge-timelines";
                        "skip-diverged": "skip-diverged";
                        "force-match": "force-match";
                    }>>;
                    createMergeCommits: z.ZodDefault<z.ZodBoolean>;
                    mergeMessage: z.ZodDefault<z.ZodString>;
                }, z.core.$strip>>;
                botBranches: z.ZodOptional<z.ZodObject<{
                    strategy: z.ZodDefault<z.ZodEnum<{
                        "delete-orphaned": "delete-orphaned";
                        sync: "sync";
                        skip: "skip";
                    }>>;
                    patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            pullRequests: z.ZodObject<{
                enabled: z.ZodBoolean;
                autoMerge: z.ZodBoolean;
                comments: z.ZodDefault<z.ZodObject<{
                    enabled: z.ZodDefault<z.ZodBoolean>;
                    attribution: z.ZodDefault<z.ZodObject<{
                        includeAuthor: z.ZodDefault<z.ZodBoolean>;
                        includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                        includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                        format: z.ZodDefault<z.ZodEnum<{
                            quoted: "quoted";
                            inline: "inline";
                            minimal: "minimal";
                        }>>;
                    }, z.core.$strip>>;
                    handleUpdates: z.ZodDefault<z.ZodBoolean>;
                    preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                    syncReplies: z.ZodDefault<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            issues: z.ZodObject<{
                enabled: z.ZodBoolean;
                comments: z.ZodDefault<z.ZodObject<{
                    enabled: z.ZodDefault<z.ZodBoolean>;
                    attribution: z.ZodDefault<z.ZodObject<{
                        includeAuthor: z.ZodDefault<z.ZodBoolean>;
                        includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                        includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                        format: z.ZodDefault<z.ZodEnum<{
                            quoted: "quoted";
                            inline: "inline";
                            minimal: "minimal";
                        }>>;
                    }, z.core.$strip>>;
                    handleUpdates: z.ZodDefault<z.ZodBoolean>;
                    preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                    syncReplies: z.ZodDefault<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            releases: z.ZodObject<{
                enabled: z.ZodBoolean;
                divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                    skip: "skip";
                    "create-anyway": "create-anyway";
                    "point-to-latest": "point-to-latest";
                }>>;
                latestReleaseStrategy: z.ZodDefault<z.ZodEnum<{
                    skip: "skip";
                    "create-anyway": "create-anyway";
                    "point-to-latest": "point-to-latest";
                }>>;
                skipPreReleases: z.ZodDefault<z.ZodBoolean>;
                pattern: z.ZodDefault<z.ZodString>;
                includeAssets: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>;
            tags: z.ZodObject<{
                enabled: z.ZodBoolean;
                divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                    skip: "skip";
                    "create-anyway": "create-anyway";
                    "point-to-latest": "point-to-latest";
                }>>;
                pattern: z.ZodDefault<z.ZodString>;
            }, z.core.$strip>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    github: z.ZodObject<{
        enabled: z.ZodBoolean;
        token: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        repo: z.ZodOptional<z.ZodString>;
        createIfNotExists: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        sync: z.ZodOptional<z.ZodObject<{
            branches: z.ZodObject<{
                enabled: z.ZodBoolean;
                protected: z.ZodBoolean;
                pattern: z.ZodString;
                historySync: z.ZodOptional<z.ZodObject<{
                    enabled: z.ZodDefault<z.ZodBoolean>;
                    strategy: z.ZodDefault<z.ZodEnum<{
                        "merge-timelines": "merge-timelines";
                        "skip-diverged": "skip-diverged";
                        "force-match": "force-match";
                    }>>;
                    createMergeCommits: z.ZodDefault<z.ZodBoolean>;
                    mergeMessage: z.ZodDefault<z.ZodString>;
                }, z.core.$strip>>;
                botBranches: z.ZodOptional<z.ZodObject<{
                    strategy: z.ZodDefault<z.ZodEnum<{
                        "delete-orphaned": "delete-orphaned";
                        sync: "sync";
                        skip: "skip";
                    }>>;
                    patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            pullRequests: z.ZodObject<{
                enabled: z.ZodBoolean;
                autoMerge: z.ZodBoolean;
                comments: z.ZodDefault<z.ZodObject<{
                    enabled: z.ZodDefault<z.ZodBoolean>;
                    attribution: z.ZodDefault<z.ZodObject<{
                        includeAuthor: z.ZodDefault<z.ZodBoolean>;
                        includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                        includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                        format: z.ZodDefault<z.ZodEnum<{
                            quoted: "quoted";
                            inline: "inline";
                            minimal: "minimal";
                        }>>;
                    }, z.core.$strip>>;
                    handleUpdates: z.ZodDefault<z.ZodBoolean>;
                    preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                    syncReplies: z.ZodDefault<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            issues: z.ZodObject<{
                enabled: z.ZodBoolean;
                comments: z.ZodDefault<z.ZodObject<{
                    enabled: z.ZodDefault<z.ZodBoolean>;
                    attribution: z.ZodDefault<z.ZodObject<{
                        includeAuthor: z.ZodDefault<z.ZodBoolean>;
                        includeTimestamp: z.ZodDefault<z.ZodBoolean>;
                        includeSourceLink: z.ZodDefault<z.ZodBoolean>;
                        format: z.ZodDefault<z.ZodEnum<{
                            quoted: "quoted";
                            inline: "inline";
                            minimal: "minimal";
                        }>>;
                    }, z.core.$strip>>;
                    handleUpdates: z.ZodDefault<z.ZodBoolean>;
                    preserveFormatting: z.ZodDefault<z.ZodBoolean>;
                    syncReplies: z.ZodDefault<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            releases: z.ZodObject<{
                enabled: z.ZodBoolean;
                divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                    skip: "skip";
                    "create-anyway": "create-anyway";
                    "point-to-latest": "point-to-latest";
                }>>;
                latestReleaseStrategy: z.ZodDefault<z.ZodEnum<{
                    skip: "skip";
                    "create-anyway": "create-anyway";
                    "point-to-latest": "point-to-latest";
                }>>;
                skipPreReleases: z.ZodDefault<z.ZodBoolean>;
                pattern: z.ZodDefault<z.ZodString>;
                includeAssets: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>;
            tags: z.ZodObject<{
                enabled: z.ZodBoolean;
                divergentCommitStrategy: z.ZodDefault<z.ZodEnum<{
                    skip: "skip";
                    "create-anyway": "create-anyway";
                    "point-to-latest": "point-to-latest";
                }>>;
                pattern: z.ZodDefault<z.ZodString>;
            }, z.core.$strip>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type BranchConfig = z.infer<typeof BranchConfigSchema>;
export type PRConfig = z.infer<typeof PRConfigSchema>;
export type IssueConfig = z.infer<typeof IssueConfigSchema>;
export type ReleaseConfig = z.infer<typeof ReleaseConfigSchema>;
export type TagConfig = z.infer<typeof TagConfigSchema>;
export type SyncConfig = z.infer<typeof SyncConfigSchema>;
export type GitlabConfig = z.infer<typeof GitlabConfigSchema>;
export type GithubConfig = z.infer<typeof GithubConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
