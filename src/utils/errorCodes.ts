export const ErrorCodes = {
  // Authentication Errors (AUTH)
  EAUTH1: 'Invalid token',
  EAUTH2: 'Token expired',
  EAUTH3: 'Missing token',

  // Permission Errors (PERM)
  EPERM1: 'Repository access denied',
  EPERM2: 'Issues permission denied',
  EPERM3: 'Pull requests permission denied',
  EPERM4: 'Releases permission denied',

  // Configuration Errors (CFG)
  ECFG01: 'Invalid configuration',
  ECFG02: 'Missing required fields',

  // Validation Errors (VAL)
  EVALGH: 'GitHub validation failed',
  EVALGL: 'GitLab validation failed',
  EVAL01: 'Multiple validation errors occurred',

  // Platform Errors (GHUB/GLAB)
  EGHUB: 'GitHub API error',
  EGLAB: 'GitLab API error',

  // File System Errors (FS)
  EFS01: 'File not found',
  EFS02: 'Permission denied',
  EFS03: 'File read error',
  EFS04: 'File write error',

  // Network Errors (NET)
  ENET1: 'Network timeout',
  ENET2: 'DNS resolution failed',
  ENET3: 'Connection refused',
  ENET4: 'Connection reset'
} as const
