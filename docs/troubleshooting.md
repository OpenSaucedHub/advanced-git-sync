# Troubleshooting Guide

This guide helps you resolve common issues with the GitHub GitLab Sync Action.

## Common Issues

### Authentication Issues

#### Workflow Scope Error

**Symptoms:**

```
refusing to allow a Personal Access Token to create or update workflow `.github/workflows/releases.yml` without `workflow` scope
```

**Cause:** The default `GITHUB_TOKEN` cannot modify workflow files for security reasons.

**Solutions:**

1. **Create a Personal Access Token with workflow scope:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Click "Generate new token (classic)"
   - Select the `workflow` scope (and `repo` scope)
   - Copy the token

2. **Add the token to repository secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GH_TOKEN`
   - Value: Your personal access token

3. **Update your workflow:**
   ```yaml
   - uses: OpenSaucedHub/advanced-git-sync@v1.4.2
     with:
       GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
       GH_TOKEN: ${{ secrets.GH_TOKEN }}
   ```

#### "Invalid token" Error

**Symptoms:**

- Action fails with "Invalid token" or "Unauthorized" error
- 401/403 HTTP status codes in logs

**Solutions:**

1. **Verify token is correct:**
   - Check that you copied the token completely
   - Ensure no extra spaces or characters

2. **Check token expiration:**
   - GitLab/GitHub tokens may have expired
   - Generate a new token if needed

3. **Verify token permissions:**
   - GitLab: Ensure `api`, `read_repository`, `write_repository` scopes
   - GitHub: Ensure `repo` and `workflow` scopes

#### "Repository not found" Error

**Symptoms:**

- Action fails with "Repository not found" or 404 errors

**Solutions:**

1. **Check repository names:**

   ```yaml
   gitlab:
     owner: 'correct-username' # Verify this matches GitLab
     repo: 'correct-repo-name' # Verify this matches exactly
   ```

2. **Use GitLab Project ID (recommended):**

   ```yaml
   gitlab:
     projectId: 12345 # Find this in GitLab project settings
   ```

3. **🆕 Enable automatic repository creation:**

   ```yaml
   gitlab:
     createIfNotExists: true # Auto-create missing repositories
   github:
     createIfNotExists: true # Auto-create missing repositories
   ```

   **Note**: This creates repositories as private by default and is disabled by default for
   security.

4. **Verify repository access:**
   - Ensure the token has access to the repository
   - Check if repository is private and token has appropriate permissions

### Configuration Issues

#### "Invalid configuration" Error

**Symptoms:**

- Action fails during configuration parsing
- YAML syntax errors

**Solutions:**

1. **Validate YAML syntax:**
   - Use a YAML validator online
   - Check indentation (use spaces, not tabs)
   - Ensure proper quoting of strings

2. **Check configuration structure:**

   ```yaml
   # Correct structure
   gitlab:
     enabled: true
     sync:
       branches:
         enabled: true
   ```

3. **Use configuration examples:**
   - Start with [basic examples](examples.md)
   - Copy from [sync-config-example.yml](../examples/sync-config-example.yml)

#### Partial Sync Not Working

**Symptoms:**

- Some entities sync but others don't
- Unexpected sync behavior

**Solutions:**

1. **Check entity-specific configuration:**

   ```yaml
   gitlab:
     sync:
       branches:
         enabled: true # Must be explicitly true
       pullRequests:
         enabled: false # Explicitly disabled
   ```

2. **Verify branch patterns:**
   ```yaml
   branches:
     pattern: "main"      # Only main branch
     pattern: "feature/*" # All feature branches
     pattern: "*"         # All branches
   ```

### Sync Issues

#### Tag Synchronization Failures

**Symptoms:**

```
Failed to sync tag v1.0.0: Failed to create tag v1.0.0: Not Found
Failed to sync tag v1.1.0: Commit 98bc36f580aa5296a32805f54c279c0982759e5a does not exist in GitLab repository
```

**Cause:** Tags reference commits that exist in one repository but not the other.

**Solutions:**

The action provides several strategies to handle tags pointing to nonexistent commits:

1. **`skip` (Default)**: Automatically skips tags pointing to commits that don't exist in the target
   repository

   ```yaml
   tags:
     divergentCommitStrategy: 'skip'
   ```

2. **`create-anyway`**: Creates tags even if the commit doesn't exist in the target repository

   ```yaml
   tags:
     divergentCommitStrategy: 'create-anyway'
   ```

3. **Configure tag patterns** to sync only specific tags:
   ```yaml
   tags:
     pattern: 'v*' # Only sync version tags
   ```

**Note:** This behavior is normal when repositories have different commit histories due to timeline
divergence.

#### Release Synchronization Failures

**Symptoms:**

```
Failed to sync release v2.0.0: Commit abc123 does not exist in target repository
Release v1.5.0 points to wrong commit after sync
```

**Cause:** Releases reference commits that exist in one repository but not the other, often due to
divergent commit histories.

**Solutions:**

The action provides intelligent strategies for handling releases with missing commits:

1. **`divergentCommitStrategy`** - Controls how to handle releases pointing to nonexistent commits:

   ```yaml
   releases:
     divergentCommitStrategy: 'skip' # skip | create-anyway
   ```

2. **`latestReleaseStrategy`** - Special handling for the latest release:
   ```yaml
   releases:
     latestReleaseStrategy: 'point-to-latest' # skip | point-to-latest | create-anyway
   ```

**Strategy Explanations:**

- **`skip`**: Skip releases pointing to commits that don't exist (safest)
- **`create-anyway`**: Create releases even if commit doesn't exist (may cause issues)
- **`point-to-latest`**: For latest release only, point to the latest commit in target repository

**Example Configuration:**

```yaml
releases:
  enabled: true
  divergentCommitStrategy: 'skip'
  latestReleaseStrategy: 'point-to-latest'
  pattern: 'v*'
```

This ensures historical releases are skipped if commits don't exist, but the latest release always
points to the current state.

#### GitLab Merge Request Errors

**Symptoms:**

```
Failed to merge MR #18: 405 Method Not Allowed
```

**Cause:** Attempting to merge a merge request that is already closed or cannot be merged.

**Solutions:**

1. **The action now handles this automatically** by:
   - Checking the current state of merge requests before operations
   - Closing merge requests instead of merging when appropriate
   - Providing better error messages

#### Branches Not Syncing

**Symptoms:**

- Branches exist on source but not on target
- Branch sync appears to run but no changes

**Solutions:**

1. **Check branch patterns:**

   ```yaml
   branches:
     pattern: '*' # Ensure pattern matches your branches
   ```

2. **Verify protected branch settings:**

   ```yaml
   branches:
     protected: true   # Include protected branches
     protected: false  # Exclude protected branches
   ```

3. **Check branch permissions:**
   - Ensure token can create branches on target repository
   - Verify no branch protection rules prevent creation

#### Bot Branches Not Handled Correctly

**Symptoms:**

- Dependabot/renovate branches keep getting recreated after deletion
- Bot branches exist in target but not source (orphaned branches)
- Bot branches sync when they shouldn't (or vice versa)

**Solutions:**

1. **Check bot branch strategy:**

   ```yaml
   branches:
     botBranches:
       strategy: 'delete-orphaned' # Clean up orphaned bot branches
       patterns: [] # Use default patterns
   ```

2. **Verify bot patterns match your branches:**

   ```yaml
   # Default patterns include: dependabot/*, renovate/*, copilot/*, feature/*, etc.
   # To see what's detected as bot branches, check the action logs
   ```

3. **Use custom patterns for specific bots:**

   ```yaml
   branches:
     botBranches:
       strategy: 'delete-orphaned'
       patterns: # Only these are considered bot branches
         - 'dependabot/*'
         - 'renovate/*'
         - 'my-company-bot/*'
   ```

4. **Disable bot branch handling:**

   ```yaml
   branches:
     botBranches:
       strategy: 'sync' # Treat bot branches like regular branches
   ```

**Common Bot Branch Issues:**

- **Orphaned branches**: Use `strategy: 'delete-orphaned'` (default)
- **Too aggressive deletion**: Use custom `patterns` to be more specific
- **Want to sync all branches**: Use `strategy: 'sync'`
- **Want to ignore bot branches**: Use `strategy: 'skip'`

#### Pull Requests/Issues Not Syncing

**Symptoms:**

- PRs/Issues exist on source but not synced to target

**Solutions:**

1. **Check sync direction:**

   ```yaml
   # This syncs FROM GitLab TO GitHub
   gitlab:
     enabled: true
     sync:
       pullRequests:
         enabled: true

   # This syncs FROM GitHub TO GitLab
   github:
     enabled: true
     sync:
       pullRequests:
         enabled: true
   ```

2. **Verify labels configuration:**
   ```yaml
   pullRequests:
     labels: ["synced"]  # String or array
     labels: []          # No labels
   ```

### Timeline Issues

#### Timeline Merging Conflicts

**Symptoms:**

- Merge conflicts during timeline merging
- Sync fails with merge conflict errors

**Solutions:**

1. **Automatic conflict resolution**: The action automatically resolves conflicts by accepting
   changes from the source repository

2. **Adjust merge strategy**:

   ```yaml
   branches:
     historySync:
       strategy: 'skip-diverged' # Conservative approach
   ```

3. **Disable merge commits**:
   ```yaml
   branches:
     historySync:
       createMergeCommits: false
   ```

#### Too Many Merge Commits

**Problem**: Timeline merging creates too many merge commits, cluttering history

**Solutions:**

1. **Disable merge commits**:

   ```yaml
   branches:
     historySync:
       createMergeCommits: false
   ```

2. **Switch to conservative strategy**:

   ```yaml
   branches:
     historySync:
       strategy: 'skip-diverged'
   ```

3. **Use force-match for clean history** (⚠️ **Destructive**):
   ```yaml
   branches:
     historySync:
       strategy: 'force-match'
   ```

#### Timeline Divergence Understanding

**What causes timeline divergence:**

- Different development workflows on each platform
- Platform-specific commits (e.g., workflow files, CI configurations)
- Timing differences in when commits are made
- Different merge strategies creating different commit SHAs

**How the action handles it:**

- **`merge-timelines`**: Creates merge commits to unify histories (preserves all work)
- **`skip-diverged`**: Only syncs commits that exist on both sides (conservative)
- **`force-match`**: Forces one repository to match the other exactly (destructive)

### Performance Issues

#### Slow Sync Performance

**Symptoms:**

- Action takes a long time to complete
- Timeouts during sync

**Solutions:**

1. **Optimize configuration:**

   ```yaml
   # Reduce sync scope
   branches:
     pattern: 'main|develop' # Specific branches only
   ```

2. **Use selective syncing:**
   ```yaml
   # Disable unnecessary syncing
   releases:
     enabled: false
   tags:
     enabled: false
   ```

#### Rate Limit Issues

**Symptoms:**

- "Rate limit exceeded" errors
- 429 HTTP status codes

**Solutions:**

1. **Reduce sync frequency:**

   ```yaml
   # In workflow file
   schedule:
     - cron: '0 */6 * * *' # Every 6 hours instead of hourly
   ```

2. **Use selective patterns:**
   ```yaml
   branches:
     pattern: 'main|release/*' # Fewer branches
   ```

## Debugging Steps

### 1. Enable Debug Logging

Add to your workflow:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

### 2. Check Action Logs

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on the failed workflow run
4. Expand the sync step to see detailed logs

### 3. Validate Configuration

Test your configuration:

```yaml
# Minimal test configuration
gitlab:
  enabled: true
  projectId: YOUR_PROJECT_ID
  sync:
    branches:
      enabled: true
      pattern: 'main' # Test with one branch first

github:
  enabled: false # Disable reverse sync for testing
```

### 4. Test Token Permissions

Manually test your tokens:

**GitLab API test:**

```bash
curl -H "Authorization: Bearer YOUR_GITLAB_TOKEN" \
     "https://gitlab.com/api/v4/projects/YOUR_PROJECT_ID"
```

**GitHub API test:**

```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     "https://api.github.com/repos/OWNER/REPO"
```

## Getting Help

### Before Opening an Issue

1. **Check existing issues:**
   - [Search existing issues](https://github.com/OpenSaucedHub/advanced-git-sync/issues)
   - Look for similar problems and solutions

2. **Gather information:**
   - Action version used
   - Configuration file (remove sensitive data)
   - Error messages from logs
   - Steps to reproduce

### Opening an Issue

Include this information:

````markdown
**Action Version:** v1.4.2

**Configuration:**

```yaml
# Your configuration with sensitive data removed
gitlab:
  enabled: true
  # ... rest of config
```
````

**Error Message:**

```
# Copy the exact error from logs
```

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:** What you expected to happen

**Actual Behavior:** What actually happened

```

### Community Support

- 💬 [GitHub Discussions](https://github.com/OpenSaucedHub/advanced-git-sync/discussions) - Ask questions and share ideas
- 🐛 [Report Issues](https://github.com/OpenSaucedHub/advanced-git-sync/issues) - Bug reports and feature requests

## Next Steps

- [Configuration Guide](configuration.md) - Complete configuration reference
- [Token Setup](token-setup.md) - Authentication setup
- [Advanced Examples](examples.md) - Complex configuration scenarios
```
