import { Config, Repository, IClient } from '../types'

export abstract class BaseClient implements IClient {
  public config: Config
  public repo: Repository

  constructor(config: Config, repo: Repository) {
    this.config = config
    this.repo = repo
  }

  abstract validateAccess(): Promise<void>
}
