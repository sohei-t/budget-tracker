import type { ApiResponse, DashboardSummary, DelayedTask } from '../types/index.ts'
import { request } from './client.ts'

export function getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  return request<ApiResponse<DashboardSummary>>('/dashboard')
}

export function getDelayedTasks(): Promise<ApiResponse<DelayedTask[]>> {
  return request<ApiResponse<DelayedTask[]>>('/dashboard/delays')
}
