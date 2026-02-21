import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request } from '../../api/client.ts'

describe('API client request', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('makes a GET request and returns data', async () => {
    const mockData = { success: true, data: [{ id: 1 }] }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 })
    )

    const result = await request('/tasks')
    expect(result).toEqual(mockData)
    expect(fetch).toHaveBeenCalledWith('/api/tasks', {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('throws on non-ok response', async () => {
    const errorData = { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(errorData), { status: 404 })
    )

    await expect(request('/tasks/999')).rejects.toThrow('Not found')
  })

  it('sends POST body as JSON', async () => {
    const mockData = { success: true, data: { id: 1, name: 'Test' } }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 201 })
    )

    await request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    })

    expect(fetch).toHaveBeenCalledWith('/api/tasks', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    })
  })
})
