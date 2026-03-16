class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

export type CalendarContext = {
  events: CalendarEvent[]
  summary: string
}

export type CalendarEvent = {
  title: string
  start: string
  end: string
}

export function getTonightContext(): Promise<CalendarContext> {
  throw new NotImplementedError('getTonightContext')
}
