import type { SessionState, Hobby } from '@/lib/types'

// --- Mocks ---

const mockDb = {
  getHobbyById: jest.fn<Hobby | null, [string]>(),
  getSession: jest.fn<SessionState | null, [string]>(),
  createSession: jest.fn<SessionState, [string]>(),
  updateSessionMessages: jest.fn(),
  updateSessionStatus: jest.fn(),
  updateSessionPlan: jest.fn(),
  abandonActiveSessions: jest.fn(),
}

const mockClaude = {
  getOpeningMessage: jest.fn<Promise<string>, [string]>(),
  streamPlanningResponse: jest.fn(),
}

jest.mock('@/lib/db', () => mockDb)
jest.mock('@/lib/claude', () => mockClaude)

// --- Helpers ---

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    id: 'test-session-id',
    hobbyId: 'hobby_guitar',
    status: 'planning',
    messages: [],
    sessionPlan: null,
    createdAt: '2026-03-21T00:00:00.000Z',
    updatedAt: '2026-03-21T00:00:00.000Z',
    ...overrides,
  }
}

function postRequest(url: string, body: Record<string, unknown>) {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function getRequest(url: string) {
  return new Request(`http://localhost${url}`, { method: 'GET' })
}

const VALID_PLAN = {
  hobbyId: 'hobby_guitar',
  duration: 60,
  intention: 'Work on blues improv',
  structure: [
    { title: 'Warmup', description: 'Scales', durationMinutes: 10, type: 'warmup' as const },
    { title: 'Main', description: 'Improv', durationMinutes: 40, type: 'main' as const },
    { title: 'Cooldown', description: 'Reflect', durationMinutes: 10, type: 'cooldown' as const },
  ],
}

// --- Tests ---

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/plan/start', () => {
  let POST: (req: Request) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../plan/start/route')
    POST = mod.POST
  })

  it('returns opening message for valid hobby', async () => {
    const session = makeSession()
    mockDb.getHobbyById.mockReturnValue({ id: 'hobby_guitar', name: 'Guitar', emoji: '🎸', goal: 'songwriting', focusAreas: [], active: true, createdAt: '' })
    mockDb.createSession.mockReturnValue(session)
    mockClaude.getOpeningMessage.mockResolvedValue('What do you want to work on tonight?')

    const res = await POST(postRequest('/api/plan/start', { hobbyId: 'hobby_guitar' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.sessionId).toBe('test-session-id')
    expect(json.hobbyId).toBe('hobby_guitar')
    expect(json.openingMessage).toBe('What do you want to work on tonight?')
    expect(mockDb.abandonActiveSessions).toHaveBeenCalled()
  })

  it('returns 400 when hobbyId is missing', async () => {
    const res = await POST(postRequest('/api/plan/start', {}))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('MISSING_HOBBY_ID')
  })

  it('returns 404 for unknown hobby', async () => {
    mockDb.getHobbyById.mockReturnValue(null)

    const res = await POST(postRequest('/api/plan/start', { hobbyId: 'hobby_unknown' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.code).toBe('HOBBY_NOT_FOUND')
  })
})

describe('POST /api/plan/message', () => {
  let POST: (req: Request) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../plan/message/route')
    POST = mod.POST
  })

  it('returns 400 when fields are missing', async () => {
    const res = await POST(postRequest('/api/plan/message', { sessionId: 'x' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('MISSING_FIELDS')
  })

  it('returns 404 when session not found', async () => {
    mockDb.getSession.mockReturnValue(null)

    const res = await POST(postRequest('/api/plan/message', { sessionId: 'missing', message: 'hi' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns 409 when session is not in planning state', async () => {
    mockDb.getSession.mockReturnValue(makeSession({ status: 'confirmed' }))

    const res = await POST(postRequest('/api/plan/message', { sessionId: 'test-session-id', message: 'hi' }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.code).toBe('INVALID_SESSION_STATE')
  })

  it('streams response for valid request', async () => {
    mockDb.getSession.mockReturnValue(makeSession())
    mockClaude.streamPlanningResponse.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello ' } }
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'world' } }
      },
    })

    const res = await POST(postRequest('/api/plan/message', { sessionId: 'test-session-id', message: 'blues improv' }))

    expect(res.headers.get('Content-Type')).toBe('text/event-stream')

    const text = await res.text()
    expect(text).toBe('Hello world')

    expect(mockDb.updateSessionMessages).toHaveBeenCalledTimes(2)
  })
})

describe('GET /api/plan/session', () => {
  let GET: (req: Request) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../plan/session/route')
    GET = mod.GET
  })

  it('returns session state', async () => {
    const session = makeSession({ messages: [{ role: 'assistant', content: 'Hello' }] })
    mockDb.getSession.mockReturnValue(session)

    const res = await GET(getRequest('/api/plan/session?sessionId=test-session-id'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.sessionId).toBe('test-session-id')
    expect(json.status).toBe('planning')
    expect(json.messages).toHaveLength(1)
  })

  it('returns 400 when sessionId is missing', async () => {
    const res = await GET(getRequest('/api/plan/session'))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('MISSING_SESSION_ID')
  })

  it('returns 404 when session not found', async () => {
    mockDb.getSession.mockReturnValue(null)

    const res = await GET(getRequest('/api/plan/session?sessionId=missing'))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.code).toBe('SESSION_NOT_FOUND')
  })
})

describe('POST /api/plan/confirm', () => {
  let POST: (req: Request) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../plan/confirm/route')
    POST = mod.POST
  })

  it('confirms session with valid plan', async () => {
    mockDb.getSession.mockReturnValue(makeSession())

    const res = await POST(postRequest('/api/plan/confirm', { sessionId: 'test-session-id', sessionPlan: VALID_PLAN }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('confirmed')
    expect(json.sessionPlan.intention).toBe('Work on blues improv')
    expect(mockDb.updateSessionPlan).toHaveBeenCalled()
  })

  it('returns 400 when fields are missing', async () => {
    const res = await POST(postRequest('/api/plan/confirm', { sessionId: 'x' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('MISSING_FIELDS')
  })

  it('returns 400 for invalid plan shape', async () => {
    const res = await POST(postRequest('/api/plan/confirm', {
      sessionId: 'test-session-id',
      sessionPlan: { hobbyId: 'hobby_guitar' },
    }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('INVALID_PLAN')
  })

  it('returns 404 when session not found', async () => {
    mockDb.getSession.mockReturnValue(null)

    const res = await POST(postRequest('/api/plan/confirm', { sessionId: 'missing', sessionPlan: VALID_PLAN }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns 409 when session is already confirmed', async () => {
    mockDb.getSession.mockReturnValue(makeSession({ status: 'confirmed' }))

    const res = await POST(postRequest('/api/plan/confirm', { sessionId: 'test-session-id', sessionPlan: VALID_PLAN }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.code).toBe('INVALID_SESSION_STATE')
  })
})

describe('POST /api/plan/abandon', () => {
  let POST: (req: Request) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../plan/abandon/route')
    POST = mod.POST
  })

  it('abandons a planning session', async () => {
    mockDb.getSession.mockReturnValue(makeSession())

    const res = await POST(postRequest('/api/plan/abandon', { sessionId: 'test-session-id' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('abandoned')
    expect(mockDb.updateSessionStatus).toHaveBeenCalledWith('test-session-id', 'abandoned')
  })

  it('returns 400 when sessionId is missing', async () => {
    const res = await POST(postRequest('/api/plan/abandon', {}))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.code).toBe('MISSING_SESSION_ID')
  })

  it('returns 404 when session not found', async () => {
    mockDb.getSession.mockReturnValue(null)

    const res = await POST(postRequest('/api/plan/abandon', { sessionId: 'missing' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns 409 when session is already finalized', async () => {
    mockDb.getSession.mockReturnValue(makeSession({ status: 'abandoned' }))

    const res = await POST(postRequest('/api/plan/abandon', { sessionId: 'test-session-id' }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.code).toBe('INVALID_SESSION_STATE')
  })
})
