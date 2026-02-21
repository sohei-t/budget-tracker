import type { ApiResponse, Task, TaskFormData } from '../types/index.ts'
import { request } from './client.ts'

export function getTasks(): Promise<ApiResponse<Task[]>> {
  return request<ApiResponse<Task[]>>('/tasks')
}

export function getTask(id: number | string): Promise<ApiResponse<Task>> {
  return request<ApiResponse<Task>>(`/tasks/${id}`)
}

export function getChildren(parentId: number | string): Promise<ApiResponse<Task[]>> {
  return request<ApiResponse<Task[]>>(`/tasks/${parentId}/children`)
}

export function createTask(data: TaskFormData): Promise<ApiResponse<Task>> {
  return request<ApiResponse<Task>>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTask(id: number | string, data: Partial<TaskFormData>): Promise<ApiResponse<Task>> {
  return request<ApiResponse<Task>>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteTask(id: number | string): Promise<ApiResponse<null>> {
  return request<ApiResponse<null>>(`/tasks/${id}`, { method: 'DELETE' })
}

export function reorderTask(id: number | string, newOrder: number): Promise<ApiResponse<Task>> {
  return request<ApiResponse<Task>>(`/tasks/${id}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ sort_order: newOrder }),
  })
}
