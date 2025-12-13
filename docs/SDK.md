# Plugin System SDK Documentation

I am looking for dev to help me implement a plugin system, as detailed bellow.

## Overview

This document outlines the proposed plugin architecture for the Advanced Git Sync project. The
plugin system will enable users to add support for additional Git providers (e.g., Codeberg, Gitea,
Bitbucket) without bloating the core package, keeping the main action lean while maintaining
extensibility.

## 🎯 Design Goals

1. **Modularity**: Core providers (GitHub, GitLab) remain in the main package, additional providers
   are plugins
2. **Size Optimization**: Reduce main package size by moving provider implementations to separate
   npm packages
3. **Simple Integration**: Users add plugins via configuration file with minimal setup
4. **Type Safety**: Full TypeScript support with shared type definitions
5. **API Consistency**: All plugins implement the same interface for predictable behavior

## 🏗️ Architecture

### Core Components

```
advanced-git-sync (Core)
├── src/
│   ├── structures/
│   │   ├── clientManager.ts      # Manages client instances and plugin loading
│   │   ├── GitHub.ts             # Built-in GitHub client
│   │   └── GitLab.ts             # Built-in GitLab client
│   ├── types/
│   │   ├── clientTypes.ts        # IClient interface (plugin contract)
│   │   └── pluginTypes.ts        # Plugin-specific types
│   └── plugins/
│       ├── loader.ts             # Dynamic plugin loader
│       └── registry.ts           # Plugin registry and validation
└── package.json

@opensaucedhub/git-sync-plugin-codeberg (Plugin)
├── src/
│   └── CodebergClient.ts         # Implements IClient interface
├── package.json
└── README.md

@opensaucedhub/git-sync-plugin-gitea (Plugin)
├── src/
│   └── GiteaClient.ts            # Implements IClient interface
├── package.json
└── README.md
```

### Plugin Discovery Mechanisms

The plugin system will support two loading strategies:

#### 1. **NPM Package Plugins** (Recommended for Production)

```yaml
providers:
  codeberg:
    enabled: true
    plugin: '@opensaucedhub/git-sync-plugin-codeberg'
    version: '^1.0.0' # Optional, uses latest if not specified
    token: ${{ secrets.CODEBERG_TOKEN }}
    owner: 'my-org'
    repo: 'my-repo'
    sync:
      branches:
        enabled: true
```

#### 2. **Local/Custom Plugins** (Development & Custom Implementations)

```yaml
providers:
  custom-git:
    enabled: true
    plugin:
      path: './plugins/custom-provider' # Relative to workspace root
      # OR
      url: 'https://github.com/user/git-sync-plugin-custom/releases/download/v1.0.0/plugin.js'
    token: ${{ secrets.CUSTOM_TOKEN }}
    # ... rest of config
```

## 📋 Plugin Interface Contract

All plugins **must** implement the `IClient` interface defined in the core package:

```typescript
// types/clientTypes.ts
export interface IClient {
  config: Config
  repo: Repository

  // Core methods
  validateAccess(): Promise<void>
  fetchBranches(filterOptions?: BranchFilterOptions): Promise<Branch[]>
  createBranch(name: string, commitSha: string): Promise<void>
  updateBranch(name: string, commitSha: string): Promise<void>
  commitExists(commitSha: string): Promise<boolean>
  getRecentCommits(branchName: string, limit: number): Promise<any[]>
  getCommitDetails(commitSha: string): Promise<{ sha: string; date: string } | null>

  // Optional metadata methods
  getRepositoryDescription?(): Promise<string | null>
  updateRepositoryDescription?(description: string): Promise<void>
  getProjectDescription?(): Promise<string | null>
  updateProjectDescription?(description: string): Promise<void>
}
```

### Helper Interfaces

Plugins should also utilize helper classes for specific features:

```typescript
// Plugin helpers structure (mirroring core structure)
export interface PluginHelpers {
  branches: BranchHelper
  pullRequest: PullRequestHelper
  issue: IssueHelper
  release: ReleaseHelper
  tags: TagHelper
  perms: PermsHelper
}
```

## 🔌 Plugin Development Guide

### 1. Creating a New Plugin

#### Project Structure

```bash
mkdir git-sync-plugin-codeberg
cd git-sync-plugin-codeberg
npm init -y
npm install --save-peer @opensaucedhub/git-sync
npm install --save-dev typescript @types/node
```

#### Package Configuration

```json
{
  "name": "@opensaucedhub/git-sync-plugin-codeberg",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@opensaucedhub/git-sync": "^1.4.0"
  },
  "dependencies": {
    "axios": "^1.6.0"
  },
  "keywords": ["git-sync", "plugin", "codeberg"],
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./package.json": "./package.json"
  }
}
```

#### Implementation Example

```typescript
// src/CodebergClient.ts
import { IClient, Config, Repository, Branch, BranchFilterOptions } from '@opensaucedhub/git-sync'
import axios, { AxiosInstance } from 'axios'

export class CodebergClient implements IClient {
  public config: Config
  public repo: Repository
  private client: AxiosInstance

  constructor(config: Config, repo: Repository) {
    this.config = config
    this.repo = repo

    // Initialize Codeberg API client
    this.client = axios.create({
      baseURL: config.codeberg?.host || 'https://codeberg.org/api/v1',
      headers: {
        Authorization: `token ${config.codeberg?.token}`,
        'Content-Type': 'application/json'
      }
    })
  }

  async validateAccess(): Promise<void> {
    try {
      await this.client.get(`/repos/${this.repo.owner}/${this.repo.repo}`)
    } catch (error) {
      throw new Error(`Codeberg access validation failed: ${error}`)
    }
  }

  async fetchBranches(filterOptions?: BranchFilterOptions): Promise<Branch[]> {
    const { data } = await this.client.get(`/repos/${this.repo.owner}/${this.repo.repo}/branches`)

    return data.map((branch: any) => ({
      name: branch.name,
      sha: branch.commit.id,
      protected: branch.protected,
      lastCommitDate: branch.commit.timestamp
    }))
  }

  async createBranch(name: string, commitSha: string): Promise<void> {
    await this.client.post(`/repos/${this.repo.owner}/${this.repo.repo}/branches`, {
      new_branch_name: name,
      old_ref_name: commitSha
    })
  }

  async updateBranch(name: string, commitSha: string): Promise<void> {
    await this.client.patch(`/repos/${this.repo.owner}/${this.repo.repo}/git/refs/heads/${name}`, {
      sha: commitSha
    })
  }

  async commitExists(commitSha: string): Promise<boolean> {
    try {
      await this.client.get(`/repos/${this.repo.owner}/${this.repo.repo}/git/commits/${commitSha}`)
      return true
    } catch {
      return false
    }
  }

  async getRecentCommits(branchName: string, limit: number): Promise<any[]> {
    const { data } = await this.client.get(`/repos/${this.repo.owner}/${this.repo.repo}/commits`, {
      params: { sha: branchName, limit }
    })
    return data
  }

  async getCommitDetails(commitSha: string): Promise<{ sha: string; date: string } | null> {
    try {
      const { data } = await this.client.get(
        `/repos/${this.repo.owner}/${this.repo.repo}/git/commits/${commitSha}`
      )
      return { sha: commitSha, date: data.committer.date }
    } catch {
      return null
    }
  }
}

// Export plugin metadata
export const pluginMetadata = {
  name: 'codeberg',
  version: '1.0.0',
  description: 'Codeberg provider plugin for Advanced Git Sync',
  author: 'OpenSaucedHub',
  clientClass: CodebergClient
}

// Default export for plugin loader
export default CodebergClient
```

### 2. Plugin Registration & Loading

#### Core Changes Required

```typescript
// src/types/pluginTypes.ts
export interface PluginMetadata {
  name: string
  version: string
  description: string
  author?: string
  clientClass: new (config: Config, repo: Repository) => IClient
}

export interface PluginConfig {
  plugin: string | { path: string } | { url: string }
  version?: string
  enabled: boolean
  token?: string
  host?: string
  owner?: string
  repo?: string
  projectId?: number
  sync?: SyncConfig
}
```

```typescript
// src/plugins/loader.ts
import * as core from '@actions/core'
import { IClient, Config, Repository, PluginMetadata, PluginConfig } from '@/types'
import * as path from 'path'
import * as fs from 'fs'

export class PluginLoader {
  private static loadedPlugins = new Map<string, PluginMetadata>()

  /**
   * Load a plugin from npm package, local path, or URL
   */
  static async loadPlugin(
    providerName: string,
    pluginConfig: PluginConfig
  ): Promise<PluginMetadata> {
    // Check cache
    if (this.loadedPlugins.has(providerName)) {
      return this.loadedPlugins.get(providerName)!
    }

    let PluginModule: any

    if (typeof pluginConfig.plugin === 'string') {
      // NPM package
      core.info(`Loading plugin: ${pluginConfig.plugin}`)
      try {
        PluginModule = await import(pluginConfig.plugin)
      } catch (error) {
        throw new Error(
          `Failed to load plugin "${pluginConfig.plugin}". ` +
            `Ensure it's installed: npm install ${pluginConfig.plugin}`
        )
      }
    } else if ('path' in pluginConfig.plugin) {
      // Local file system plugin
      const pluginPath = path.resolve(process.cwd(), pluginConfig.plugin.path)

      if (!fs.existsSync(pluginPath)) {
        throw new Error(`Plugin not found at path: ${pluginPath}`)
      }

      core.info(`Loading local plugin: ${pluginPath}`)
      PluginModule = await import(pluginPath)
    } else if ('url' in pluginConfig.plugin) {
      // Remote URL plugin (requires downloading first)
      throw new Error('URL-based plugins not yet implemented')
    }

    // Extract plugin metadata
    const ClientClass = PluginModule.default || PluginModule.clientClass
    const metadata: PluginMetadata = PluginModule.pluginMetadata || {
      name: providerName,
      version: pluginConfig.version || '1.0.0',
      description: `Plugin for ${providerName}`,
      clientClass: ClientClass
    }

    // Validate plugin implements IClient interface
    this.validatePluginInterface(ClientClass)

    this.loadedPlugins.set(providerName, metadata)
    core.info(`✓ Plugin loaded: ${metadata.name} v${metadata.version}`)

    return metadata
  }

  /**
   * Validate that plugin implements required IClient interface
   */
  private static validatePluginInterface(ClientClass: any): void {
    const requiredMethods = [
      'validateAccess',
      'fetchBranches',
      'createBranch',
      'updateBranch',
      'commitExists',
      'getRecentCommits',
      'getCommitDetails'
    ]

    for (const method of requiredMethods) {
      if (typeof ClientClass.prototype[method] !== 'function') {
        throw new Error(`Plugin does not implement required method: ${method}`)
      }
    }
  }

  /**
   * Create client instance from loaded plugin
   */
  static createClientInstance(metadata: PluginMetadata, config: Config, repo: Repository): IClient {
    return new metadata.clientClass(config, repo)
  }
}
```

#### Enhanced ClientManager

```typescript
// src/structures/clientManager.ts (Enhanced)
import { Config } from '../../types'
import { GitHubClient } from './GitHub'
import { GitLabClient } from './GitLab'
import { PluginLoader } from '@/src/plugins/loader'
import * as core from '@actions/core'
import { getGitHubRepo, getGitLabRepo } from '../utils/repoUtils'

export class ClientManager {
  private static githubClient: GitHubClient
  private static gitlabClient: GitLabClient
  private static pluginClients = new Map<string, any>()

  static getGitHubClient(config: Config): GitHubClient {
    if (!this.githubClient) {
      core.startGroup('🐱 GitHub Client Initialization')
      this.githubClient = new GitHubClient(config, getGitHubRepo(config))
    }
    return this.githubClient
  }

  static getGitLabClient(config: Config): GitLabClient {
    if (!this.gitlabClient) {
      core.startGroup('🦊 GitLab Client Initialization')
      this.gitlabClient = new GitLabClient(config, getGitLabRepo(config))
      core.endGroup()
    }
    return this.gitlabClient
  }

  /**
   * Get or create plugin client instance
   */
  static async getPluginClient(providerName: string, config: Config): Promise<any> {
    if (this.pluginClients.has(providerName)) {
      return this.pluginClients.get(providerName)!
    }

    core.startGroup(`🔌 ${providerName} Plugin Client Initialization`)

    const providerConfig = (config as any)[providerName]
    if (!providerConfig?.enabled) {
      throw new Error(`Provider ${providerName} is not enabled`)
    }

    // Load plugin
    const metadata = await PluginLoader.loadPlugin(providerName, providerConfig)

    // Create repository object
    const repo = {
      owner: providerConfig.owner || '',
      repo: providerConfig.repo || ''
    }

    // Create client instance
    const client = PluginLoader.createClientInstance(metadata, config, repo)
    this.pluginClients.set(providerName, client)

    core.info(`✓ ${providerName} client initialized successfully`)
    core.endGroup()

    return client
  }

  /**
   * Get all enabled clients (built-in + plugins)
   */
  static async getAllClients(config: Config): Promise<Map<string, any>> {
    const clients = new Map<string, any>()

    // Add built-in clients
    if (config.github?.enabled) {
      clients.set('github', this.getGitHubClient(config))
    }
    if (config.gitlab?.enabled) {
      clients.set('gitlab', this.getGitLabClient(config))
    }

    // Add plugin clients
    for (const [key, value] of Object.entries(config)) {
      if (
        key !== 'github' &&
        key !== 'gitlab' &&
        typeof value === 'object' &&
        value !== null &&
        (value as any).enabled === true &&
        (value as any).plugin
      ) {
        const client = await this.getPluginClient(key, config)
        clients.set(key, client)
      }
    }

    return clients
  }
}
```

### 3. Configuration Schema Updates

```typescript
// types/configTypes.ts (additions)
import { z } from 'zod'

// Plugin configuration schema
export const PluginConfigSchema = z.object({
  enabled: z.boolean(),
  plugin: z.union([
    z.string(), // NPM package name
    z.object({ path: z.string() }), // Local path
    z.object({ url: z.string() }) // Remote URL
  ]),
  version: z.string().optional(),
  token: z.string().optional(),
  host: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
  projectId: z.number().optional(),
  sync: SyncConfigSchema.optional()
})

// Allow dynamic provider keys
export const ConfigSchema = z
  .object({
    gitlab: GitlabConfigSchema,
    github: GithubConfigSchema
  })
  .catchall(PluginConfigSchema) // Accept any additional provider configs

export type PluginConfig = z.infer<typeof PluginConfigSchema>
```

## 📝 Usage Examples

### Example 1: Using Codeberg Plugin

```yaml
# .github/sync-config.yml
github:
  enabled: true
  token: ${{ secrets.GH_TOKEN }}

codeberg:
  enabled: true
  plugin: '@opensaucedhub/git-sync-plugin-codeberg'
  token: ${{ secrets.CODEBERG_TOKEN }}
  host: 'https://codeberg.org'
  owner: 'myusername'
  repo: 'my-project'
  sync:
    branches:
      enabled: true
      pattern: '*'
    tags:
      enabled: true
```

### Example 2: Multiple Custom Providers

```yaml
# .github/sync-config.yml
github:
  enabled: true

gitlab:
  enabled: true
  projectId: 12345

codeberg:
  enabled: true
  plugin: '@opensaucedhub/git-sync-plugin-codeberg'
  owner: 'my-org'
  repo: 'project-a'

gitea:
  enabled: true
  plugin: '@opensaucedhub/git-sync-plugin-gitea'
  host: 'https://gitea.example.com'
  owner: 'my-org'
  repo: 'project-a'
  sync:
    branches:
      enabled: true
```

### Example 3: Local Development Plugin

```yaml
# .github/sync-config.yml
github:
  enabled: true

custom-provider:
  enabled: true
  plugin:
    path: './plugins/my-custom-provider'
  token: ${{ secrets.CUSTOM_TOKEN }}
  owner: 'test-user'
  repo: 'test-repo'
```

## 🧪 Testing Plugins

### Unit Testing Template

```typescript
// test/CodebergClient.test.ts
import { CodebergClient } from '../src/CodebergClient'
import { Config, Repository } from '@opensaucedhub/git-sync'

describe('CodebergClient', () => {
  let client: CodebergClient
  let mockConfig: Config
  let mockRepo: Repository

  beforeEach(() => {
    mockConfig = {
      codeberg: {
        enabled: true,
        token: 'test-token',
        host: 'https://codeberg.org'
      }
    } as Config

    mockRepo = {
      owner: 'test-owner',
      repo: 'test-repo'
    }

    client = new CodebergClient(mockConfig, mockRepo)
  })

  it('should validate access', async () => {
    await expect(client.validateAccess()).resolves.not.toThrow()
  })

  it('should fetch branches', async () => {
    const branches = await client.fetchBranches()
    expect(Array.isArray(branches)).toBe(true)
  })

  // Add more tests...
})
```

## 📦 Publishing Plugins

### Plugin Naming Convention

Follow this naming pattern for consistency:

- **NPM Package**: `@opensaucedhub/git-sync-plugin-<provider>`
- **GitHub Repo**: `git-sync-plugin-<provider>`

### Plugin Registry (Future Enhancement)

Create a central registry for approved plugins:

```json
{
  "plugins": [
    {
      "name": "codeberg",
      "package": "@opensaucedhub/git-sync-plugin-codeberg",
      "version": "1.0.0",
      "description": "Codeberg provider support",
      "repository": "https://github.com/OpenSaucedHub/git-sync-plugin-codeberg",
      "verified": true
    },
    {
      "name": "gitea",
      "package": "@opensaucedhub/git-sync-plugin-gitea",
      "version": "1.0.0",
      "description": "Gitea provider support",
      "repository": "https://github.com/OpenSaucedHub/git-sync-plugin-gitea",
      "verified": true
    }
  ]
}
```

## 🔐 Security Considerations

1. **Plugin Verification**: Only load verified plugins in production environments
2. **Sandboxing**: Consider using VM2 or isolated-vm for untrusted plugins
3. **Token Management**: Plugins should never store or log tokens
4. **Rate Limiting**: Implement rate limiting in plugin API calls
5. **Dependency Auditing**: Regularly audit plugin dependencies for vulnerabilities

## 🚀 Migration Path

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Create plugin loader system
- [ ] Update `ClientManager` with plugin support
- [ ] Add plugin configuration schema
- [ ] Create SDK documentation and interfaces

### Phase 2: Reference Implementation (Week 2-3)

- [ ] Extract GitLab client as internal plugin (proof of concept)
- [ ] Create Codeberg plugin as external reference
- [ ] Develop plugin testing framework

### Phase 3: Community Adoption (Week 4+)

- [ ] Publish plugin SDK and documentation
- [ ] Create plugin template repository
- [ ] Build plugin registry and discovery
- [ ] Accept community contributions

## 📊 Benefits Analysis

### Size Reduction Estimates

Current package size (approximate):

```
Total: ~15MB
├── Core: ~5MB
├── GitHub deps (@actions/github, @octokit): ~3MB
└── GitLab deps (@gitbeaker/rest): ~7MB
```

With plugin system:

```
Core package: ~8MB (-47% reduction)
├── Core: ~5MB
└── GitHub deps: ~3MB (most common use case)

Optional plugins:
├── @opensaucedhub/git-sync-plugin-gitlab: ~7MB
├── @opensaucedhub/git-sync-plugin-codeberg: ~1MB
└── @opensaucedhub/git-sync-plugin-gitea: ~1MB
```

### Performance Impact

- **Plugin Loading**: ~50-100ms overhead per plugin
- **Runtime Performance**: Negligible (same as built-in clients)
- **Memory Usage**: Proportional to number of active providers

## 🤝 Contributing Plugins

To contribute a new provider plugin:

1. Fork the plugin template: `git-sync-plugin-template`
2. Implement the `IClient` interface
3. Add comprehensive tests (>80% coverage)
4. Document configuration options
5. Submit PR to the plugin registry

## 📚 Resources

- **Plugin Template**:
  [git-sync-plugin-template](https://github.com/OpenSaucedHub/git-sync-plugin-template)
- **Example Plugin**:
  [git-sync-plugin-codeberg](https://github.com/OpenSaucedHub/git-sync-plugin-codeberg)
- **Type Definitions**: Available in `@opensaucedhub/git-sync` package
- **Community Plugins**:
  [Plugin Registry](https://github.com/OpenSaucedHub/advanced-git-sync/wiki/Plugins)

## 🔮 Future Enhancements

1. **Plugin Marketplace**: Web UI for browsing and discovering plugins
2. **Plugin Analytics**: Track plugin usage and performance metrics
3. **Hot Reloading**: Update plugins without restarting the action
4. **Plugin Dependencies**: Allow plugins to depend on other plugins
5. **Plugin Hooks**: Lifecycle hooks for custom behavior injection
6. **Visual Plugin Builder**: No-code tool for creating simple plugins

---

**Questions?** Open an issue or start a discussion in the
[Advanced Git Sync repository](https://github.com/OpenSaucedHub/advanced-git-sync).
