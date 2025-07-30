import { z } from 'zod';
export declare const BranchConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    protected: z.ZodBoolean;
    pattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    protected: boolean;
    pattern: string;
}, {
    enabled: boolean;
    protected: boolean;
    pattern: string;
}>;
export declare const PRConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    autoMerge: z.ZodBoolean;
    labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    autoMerge: boolean;
    labels: string | string[];
}, {
    enabled: boolean;
    autoMerge: boolean;
    labels: string | string[];
}>;
export declare const IssueConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    syncComments: z.ZodBoolean;
    labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    labels: string | string[];
    syncComments: boolean;
}, {
    enabled: boolean;
    labels: string | string[];
    syncComments: boolean;
}>;
export declare const SyncConfigSchema: z.ZodObject<{
    branches: z.ZodObject<{
        enabled: z.ZodBoolean;
        protected: z.ZodBoolean;
        pattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        protected: boolean;
        pattern: string;
    }, {
        enabled: boolean;
        protected: boolean;
        pattern: string;
    }>;
    pullRequests: z.ZodObject<{
        enabled: z.ZodBoolean;
        autoMerge: z.ZodBoolean;
        labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        autoMerge: boolean;
        labels: string | string[];
    }, {
        enabled: boolean;
        autoMerge: boolean;
        labels: string | string[];
    }>;
    issues: z.ZodObject<{
        enabled: z.ZodBoolean;
        syncComments: z.ZodBoolean;
        labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        labels: string | string[];
        syncComments: boolean;
    }, {
        enabled: boolean;
        labels: string | string[];
        syncComments: boolean;
    }>;
    releases: z.ZodObject<{
        enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
    }, {
        enabled: boolean;
    }>;
    tags: z.ZodObject<{
        enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
    }, {
        enabled: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    issues: {
        enabled: boolean;
        labels: string | string[];
        syncComments: boolean;
    };
    branches: {
        enabled: boolean;
        protected: boolean;
        pattern: string;
    };
    pullRequests: {
        enabled: boolean;
        autoMerge: boolean;
        labels: string | string[];
    };
    releases: {
        enabled: boolean;
    };
    tags: {
        enabled: boolean;
    };
}, {
    issues: {
        enabled: boolean;
        labels: string | string[];
        syncComments: boolean;
    };
    branches: {
        enabled: boolean;
        protected: boolean;
        pattern: string;
    };
    pullRequests: {
        enabled: boolean;
        autoMerge: boolean;
        labels: string | string[];
    };
    releases: {
        enabled: boolean;
    };
    tags: {
        enabled: boolean;
    };
}>;
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
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        }, {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        }>;
        pullRequests: z.ZodObject<{
            enabled: z.ZodBoolean;
            autoMerge: z.ZodBoolean;
            labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        }, {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        }>;
        issues: z.ZodObject<{
            enabled: z.ZodBoolean;
            syncComments: z.ZodBoolean;
            labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        }, {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        }>;
        releases: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
        }, {
            enabled: boolean;
        }>;
        tags: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
        }, {
            enabled: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    }, {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    projectId?: number | null | undefined;
    host?: string | undefined;
    token?: string | undefined;
    owner?: string | undefined;
    repo?: string | undefined;
    sync?: {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    } | undefined;
}, {
    enabled: boolean;
    projectId?: number | null | undefined;
    host?: string | undefined;
    token?: string | undefined;
    owner?: string | undefined;
    repo?: string | undefined;
    sync?: {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    } | undefined;
}>;
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
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        }, {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        }>;
        pullRequests: z.ZodObject<{
            enabled: z.ZodBoolean;
            autoMerge: z.ZodBoolean;
            labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        }, {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        }>;
        issues: z.ZodObject<{
            enabled: z.ZodBoolean;
            syncComments: z.ZodBoolean;
            labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        }, {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        }>;
        releases: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
        }, {
            enabled: boolean;
        }>;
        tags: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
        }, {
            enabled: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    }, {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    token?: string | undefined;
    owner?: string | undefined;
    repo?: string | undefined;
    sync?: {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    } | undefined;
}, {
    enabled: boolean;
    token?: string | undefined;
    owner?: string | undefined;
    repo?: string | undefined;
    sync?: {
        issues: {
            enabled: boolean;
            labels: string | string[];
            syncComments: boolean;
        };
        branches: {
            enabled: boolean;
            protected: boolean;
            pattern: string;
        };
        pullRequests: {
            enabled: boolean;
            autoMerge: boolean;
            labels: string | string[];
        };
        releases: {
            enabled: boolean;
        };
        tags: {
            enabled: boolean;
        };
    } | undefined;
}>;
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
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            }, {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            }>;
            pullRequests: z.ZodObject<{
                enabled: z.ZodBoolean;
                autoMerge: z.ZodBoolean;
                labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            }, {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            }>;
            issues: z.ZodObject<{
                enabled: z.ZodBoolean;
                syncComments: z.ZodBoolean;
                labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            }, {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            }>;
            releases: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
            }, {
                enabled: boolean;
            }>;
            tags: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
            }, {
                enabled: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        }, {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        projectId?: number | null | undefined;
        host?: string | undefined;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    }, {
        enabled: boolean;
        projectId?: number | null | undefined;
        host?: string | undefined;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    }>;
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
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            }, {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            }>;
            pullRequests: z.ZodObject<{
                enabled: z.ZodBoolean;
                autoMerge: z.ZodBoolean;
                labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            }, {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            }>;
            issues: z.ZodObject<{
                enabled: z.ZodBoolean;
                syncComments: z.ZodBoolean;
                labels: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            }, {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            }>;
            releases: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
            }, {
                enabled: boolean;
            }>;
            tags: z.ZodObject<{
                enabled: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
            }, {
                enabled: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        }, {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    }, {
        enabled: boolean;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    gitlab: {
        enabled: boolean;
        projectId?: number | null | undefined;
        host?: string | undefined;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    };
    github: {
        enabled: boolean;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    };
}, {
    gitlab: {
        enabled: boolean;
        projectId?: number | null | undefined;
        host?: string | undefined;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    };
    github: {
        enabled: boolean;
        token?: string | undefined;
        owner?: string | undefined;
        repo?: string | undefined;
        sync?: {
            issues: {
                enabled: boolean;
                labels: string | string[];
                syncComments: boolean;
            };
            branches: {
                enabled: boolean;
                protected: boolean;
                pattern: string;
            };
            pullRequests: {
                enabled: boolean;
                autoMerge: boolean;
                labels: string | string[];
            };
            releases: {
                enabled: boolean;
            };
            tags: {
                enabled: boolean;
            };
        } | undefined;
    };
}>;
export type BranchConfig = z.infer<typeof BranchConfigSchema>;
export type PRConfig = z.infer<typeof PRConfigSchema>;
export type IssueConfig = z.infer<typeof IssueConfigSchema>;
export type SyncConfig = z.infer<typeof SyncConfigSchema>;
export type GitlabConfig = z.infer<typeof GitlabConfigSchema>;
export type GithubConfig = z.infer<typeof GithubConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
