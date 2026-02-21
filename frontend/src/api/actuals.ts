import type { ApiResponse, Actual, ActualFormData } from '../types/index.ts'
import { request } from './client.ts'

export function getActuals(taskId: number | string): Promise<ApiResponse<Actual[]>> {
  return request<ApiResponse<Actual[]>>(`/tasks/${taskId}/actuals`)
}

export function recordActual(taskId: number | string, data: ActualFormData): Promise<ApiResponse<Actual>> {
  return request<ApiResponse<Actual>>(`/tasks/${taskId}/actuals`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateActual(actualId: number | string, data: Partial<ActualFormData>): Promise<ApiResponse<Actual>> {
  return request<ApiResponse<Actual>>(`/actuals/${actualId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteActual(actualId: number | string): Promise<ApiResponse<null>> {
  return request<ApiResponse<null>>(`/actuals/${actualId}`, { method: 'DELETE' })
}
