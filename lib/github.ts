class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

export type CommitInfo = {
  sha: string
  message: string
  date: string
  repo: string
}

export function getRecentCommits(): Promise<CommitInfo[]> {
  throw new NotImplementedError('getRecentCommits')
}
