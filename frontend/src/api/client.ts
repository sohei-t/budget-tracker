const BASE_URL = '/api'

export interface RequestError extends Error {
  code: string
  status: number
  details: string[]
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const config: RequestInit = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }

  const response = await fetch(url, config)
  const data = await response.json()

  if (!response.ok) {
    const error = new Error(
      data.error?.message || `HTTP ${response.status}`
    ) as RequestError
    error.code = data.error?.code || 'UNKNOWN'
    error.status = response.status
    error.details = data.error?.details || []
    throw error
  }

  return data as T
}
