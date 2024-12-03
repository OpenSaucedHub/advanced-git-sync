import { Config, Repository, IClient } from '../types'

export abstract class BaseClient implements IClient {
  public config: Config
  public repo: Repository

  constructor(config: Config, repo: Repository) {
    this.config = config
    this.repo = repo

    // Validate either projectId or repo information is present
    if (!config.gitlab?.projectId && (!repo.owner || !repo.repo)) {
      throw new Error(
        'Either projectId or repository information must be provided'
      )
    }
  }

  abstract validateAccess(): Promise<void>
}
