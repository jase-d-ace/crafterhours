class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

export function generateJournal(_sessionLog: string): Promise<string> {
  throw new NotImplementedError('generateJournal')
}

export function generatePracticeLog(_sessionLog: string): Promise<string> {
  throw new NotImplementedError('generatePracticeLog')
}

export function generateCodingSummary(_sessionLog: string): Promise<string> {
  throw new NotImplementedError('generateCodingSummary')
}
