# Troubleshooting Guide

This guide helps you resolve common issues with the GitHub GitLab Sync Action.

## Common Issues

### Authentication Issues

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

3. **Verify repository access:**
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

   issues:
     syncComments: false # Skip comments for performance
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
**Action Version:** v1.1.6

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
