import { POST as startPlan } from '../start/route'
import { POST as sendMessage } from '../message/route'
import { GET as getSessionRoute } from '../session/route'
import { POST as confirmPlan } from '../confirm/route'
import { POST as abandonPlan } from '../abandon/route'

// Mock the plan mocks module
const mockStartSessionFn = jest.fn()
const mockSendMessageFn = jest.fn()
const mockGetSessionFn = jest.fn()
const mockConfirmPlanFn = jest.fn()
const mockAbandonSessionFn = jest.fn()

jest.mock('@/lib/mocks/plan', () => ({
  mockStartSession: (...args: unknown[]) => mockStartSessionFn(...args),
  mockSendMessage: (...args: unknown[]) => mockSendMessageFn(...args),
  mockGetSession: (...args: unknown[]) => mockGetSessionFn(...args),
  mockConfirmPlan: (...args: unknown[]) => mockConfirmPlanFn(...args),
  mockAbandonSession: (...args: unknown[]) => mockAbandonSessionFn(...args),
}))

jest.mock('@/lib/hobbies', () => ({
  getDefaultHobbies: () => [
    {
      id: 'hobby_guitar',
      name: 'Guitar',
      emoji: '🎸',
      goal: 'become a well-rounded blues/rock songwriter',
      focusAreas: ['improvisation', 'songwriting'],
      active: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'hobby_writing',
      name: 'Writing',
      emoji: '✍️',
      goal: 'build a consistent writing practice',
      focusAreas: ['journaling', 'creative writing'],
      active: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
}))

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(url: string): Request {
  return new Request(url, { method: 'GET' })
}

const validPlan = {
  hobbyId: 'hobby_guitar',
  duration: 60,
  intention: 'Practice pentatonic boxes',
  structure: [
    {
      title: 'Warmup',
      description: 'Scales',
      durationMinutes: 10,
      type: 'warmup',
    },
    {
      title: 'Main practice',
      description: 'Box connections',
      durationMinutes: 40,
      type: 'main',
    },
    {
      title: 'Reflect',
      description: 'Notes',
      durationMinutes: 10,
      type: 'reflection',
    },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
})

// --- POST /api/plan/start ---

describe('POST /api/plan/start', () => {
  it('returns opening message for a valid hobby', async () => {
    mockStartSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      openingMessage: 'What do you want to work on tonight?',
    })

    const res = await startPlan(makeRequest({ hobbyId: 'hobby_guitar' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.sessionId).toBe('test-uuid')
    expect(body.hobbyId).toBe('hobby_guitar')
    expect(body.openingMessage).toBe('What do you want to work on tonight?')
  })

  it('returns 400 when hobbyId is missing', async () => {
    const res = await startPlan(makeRequest({}))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('MISSING_HOBBY_ID')
  })

  it('returns 404 for unknown hobbyId', async () => {
    const res = await startPlan(makeRequest({ hobbyId: 'hobby_unknown' }))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('HOBBY_NOT_FOUND')
  })
})

// --- POST /api/plan/message ---

describe('POST /api/plan/message', () => {
  it('streams a response for a valid message', async () => {
    mockGetSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      status: 'planning',
      messages: [{ role: 'assistant', content: 'Opening message' }],
      sessionPlan: null,
    })

    async function* fakeStream() {
      yield 'Hello '
      yield 'world'
    }
    mockSendMessageFn.mockReturnValue(fakeStream())

    const res = await sendMessage(
      makeRequest({ sessionId: 'test-uuid', message: 'I want to practice scales' })
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')

    const text = await res.text()
    expect(text).toContain('Hello')
    expect(text).toContain('world')
  })

  it('returns 400 when fields are missing', async () => {
    const res = await sendMessage(makeRequest({ sessionId: 'test-uuid' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('MISSING_FIELDS')
  })

  it('returns 404 when session not found', async () => {
    mockGetSessionFn.mockReturnValue(undefined)

    const res = await sendMessage(
      makeRequest({ sessionId: 'nonexistent', message: 'hi' })
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns 409 when session is not in planning state', async () => {
    mockGetSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      status: 'confirmed',
      messages: [],
      sessionPlan: null,
    })

    const res = await sendMessage(
      makeRequest({ sessionId: 'test-uuid', message: 'hi' })
    )
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.code).toBe('INVALID_SESSION_STATE')
  })
})

// --- GET /api/plan/session ---

describe('GET /api/plan/session', () => {
  it('returns session state for a valid sessionId', async () => {
    mockGetSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      status: 'planning',
      messages: [{ role: 'assistant', content: 'Hello' }],
      sessionPlan: null,
    })

    const res = await getSessionRoute(
      makeGetRequest('http://localhost:3000/api/plan/session?sessionId=test-uuid')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.sessionId).toBe('test-uuid')
    expect(body.hobbyId).toBe('hobby_guitar')
    expect(body.status).toBe('planning')
    expect(body.messages).toHaveLength(1)
    expect(body.sessionPlan).toBeNull()
  })

  it('returns 400 when sessionId is missing', async () => {
    const res = await getSessionRoute(
      makeGetRequest('http://localhost:3000/api/plan/session')
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('MISSING_SESSION_ID')
  })

  it('returns 404 when session not found', async () => {
    mockGetSessionFn.mockReturnValue(undefined)

    const res = await getSessionRoute(
      makeGetRequest('http://localhost:3000/api/plan/session?sessionId=nonexistent')
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('SESSION_NOT_FOUND')
  })
})

// --- POST /api/plan/confirm ---

describe('POST /api/plan/confirm', () => {
  it('confirms a session with a valid plan', async () => {
    mockGetSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      status: 'planning',
      messages: [],
      sessionPlan: null,
    })
    mockConfirmPlanFn.mockReturnValue({
      sessionId: 'test-uuid',
      status: 'confirmed',
      sessionPlan: validPlan,
    })

    const res = await confirmPlan(
      makeRequest({ sessionId: 'test-uuid', sessionPlan: validPlan })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('confirmed')
    expect(body.sessionPlan).toEqual(validPlan)
  })

  it('returns 400 when fields are missing', async () => {
    const res = await confirmPlan(makeRequest({ sessionId: 'test-uuid' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('MISSING_FIELDS')
  })

  it('returns 400 for invalid plan structure', async () => {
    const res = await confirmPlan(
      makeRequest({
        sessionId: 'test-uuid',
        sessionPlan: { hobbyId: 'x', duration: 'not a number' },
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('INVALID_PLAN')
  })

  it('returns 404 when session not found', async () => {
    mockGetSessionFn.mockReturnValue(undefined)

    const res = await confirmPlan(
      makeRequest({ sessionId: 'nonexistent', sessionPlan: validPlan })
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns 409 when session is already confirmed', async () => {
    mockGetSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      status: 'confirmed',
      messages: [],
      sessionPlan: validPlan,
    })

    const res = await confirmPlan(
      makeRequest({ sessionId: 'test-uuid', sessionPlan: validPlan })
    )
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.code).toBe('INVALID_SESSION_STATE')
  })
})

// --- POST /api/plan/abandon ---

describe('POST /api/plan/abandon', () => {
  it('abandons a planning session', async () => {
    mockGetSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      status: 'planning',
      messages: [],
      sessionPlan: null,
    })
    mockAbandonSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      status: 'abandoned',
    })

    const res = await abandonPlan(makeRequest({ sessionId: 'test-uuid' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('abandoned')
  })

  it('returns 400 when sessionId is missing', async () => {
    const res = await abandonPlan(makeRequest({}))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('MISSING_SESSION_ID')
  })

  it('returns 404 when session not found', async () => {
    mockGetSessionFn.mockReturnValue(undefined)

    const res = await abandonPlan(makeRequest({ sessionId: 'nonexistent' }))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('SESSION_NOT_FOUND')
  })

  it('returns 409 when session is already finalized', async () => {
    mockGetSessionFn.mockReturnValue({
      sessionId: 'test-uuid',
      hobbyId: 'hobby_guitar',
      status: 'confirmed',
      messages: [],
      sessionPlan: null,
    })

    const res = await abandonPlan(makeRequest({ sessionId: 'test-uuid' }))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.code).toBe('INVALID_SESSION_STATE')
  })
})
