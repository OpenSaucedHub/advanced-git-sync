# 🔧 Local Development Guide

This guide helps you set up and test the Advanced Git Sync locally before pushing changes.

## 🚀 Quick Start

### 1. **Setup Environment**

```bash
# Setup local development environment
bun run dev:setup

# Or manually copy the example
cp .env.example .env
```

### 2. **Configure Tokens**

Edit `.env` file with your actual tokens:

```bash
GITHUB_TOKEN=your_github_token_here
GITLAB_TOKEN=your_gitlab_token_here
```

### 3. **Configure Repositories**

Edit `sync-config.local.yml` with your repository details:

```yaml
gitlab:
  owner: your-gitlab-username
  repo: your-repo-name
  projectId: your-project-id

github:
  owner: your-github-username
  repo: your-repo-name
```

### 4. **Run Local Sync**

```bash
# Run with setup check
bun run dev:sync

# Or run directly
bun s
```

## 📁 **File Structure**

```
├── .env                     # Your local tokens (DO NOT COMMIT)
├── .env.example            # Template for environment variables
├── sync-config.local.yml   # Local configuration (optional)
├── .github/sync-config.yml # Production configuration
└── scripts/local-test.js   # Development setup script
```

## 🔧 **Available Scripts**

| Script              | Description                         |
| ------------------- | ----------------------------------- |
| `bun s`             | Run sync directly                   |
| `bun run dev:setup` | Setup local development environment |
| `bun run dev:sync`  | Setup + run sync                    |
| `bun run build`     | Build for production                |
| `bun run lint`      | Check code quality                  |

## 🧪 **Testing Strategy**

### **Safe Testing Configuration**

To avoid creating too many test releases/issues, modify your `sync-config.local.yml`:

```yaml
gitlab:
  sync:
    releases:
      enabled: false # Disable during testing
    tags:
      enabled: false # Disable during testing
    branches:
      pattern: 'main' # Only sync main branch
      botBranches:
        strategy: 'sync' # Don't delete branches during testing

github:
  sync:
    releases:
      enabled: false # Disable during testing
    tags:
      enabled: false # Disable during testing
    branches:
      pattern: 'main' # Only sync main branch
      botBranches:
        strategy: 'sync' # Don't delete branches during testing
```

### **Test Individual Features**

Enable only the feature you want to test:

```yaml
# Test only branch sync
gitlab:
  sync:
    branches:
      enabled: true
      botBranches:
        strategy: 'sync' # Safe for testing
    pullRequests: { enabled: false }
    issues: { enabled: false }
    releases: { enabled: false }
    tags: { enabled: false }
```

## 🔒 **Security Notes**

- ✅ `.env` is in `.gitignore` - your tokens are safe
- ✅ `sync-config.local.yml` is in `.gitignore` - your local config is safe
- ⚠️ **Never commit real tokens to version control**
- 🔄 **Change tokens after testing if needed**

## 🐛 **Debugging**

### **Enable Debug Logging**

Set in your `.env`:

```bash
DEBUG=true
NODE_ENV=development
```

### **Check Configuration**

```bash
# Verify your config is loaded correctly
bun run dev:setup
```

### **Common Issues**

1. **"Token not found"** - Check your `.env` file
2. **"Config not found"** - Ensure `sync-config.local.yml` exists or use default
3. **"Repository not found"** - Verify repository names in config
4. **"Permission denied"** - Check token permissions

## 📊 **Production vs Development**

| Environment     | Config File               | Token Source   | Purpose        |
| --------------- | ------------------------- | -------------- | -------------- |
| **Production**  | `.github/sync-config.yml` | GitHub Secrets | Automated sync |
| **Development** | `sync-config.local.yml`   | `.env` file    | Local testing  |

## 🎯 **Best Practices**

1. **Test incrementally** - Enable one sync type at a time
2. **Use test repositories** - Don't test on production repos
3. **Disable heavy operations** - Turn off releases/tags during development
4. **Monitor API limits** - GitHub/GitLab have rate limits
5. **Clean up test data** - Remove test branches/PRs after testing

## 🔄 **Workflow**

1. Make code changes
2. Update local config for safe testing
3. Run `bun run dev:sync`
4. Verify changes work correctly
5. Update production config if needed
6. Commit and push (tokens stay secure)
7. Test in production environment
