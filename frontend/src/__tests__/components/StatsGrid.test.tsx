import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsGrid } from '../../components/dashboard/StatsGrid.tsx'
import type { DashboardSummary } from '../../types/index.ts'

describe('StatsGrid', () => {
  const mockSummary: DashboardSummary = {
    total_tasks: 20,
    completed_tasks: 8,
    in_progress_tasks: 7,
    not_started_tasks: 5,
    overall_progress_percent: 40,
    overdue_count: 2,
    at_risk_count: 3,
    major_items: [],
  }

  it('renders all stat cards', () => {
    render(<StatsGrid summary={mockSummary} />)
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders labels', () => {
    render(<StatsGrid summary={mockSummary} />)
    expect(screen.getByText('Total Tasks')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('applies danger class when overdue count > 0', () => {
    const { container } = render(<StatsGrid summary={mockSummary} />)
    const dangerCard = container.querySelector('.stat-card--danger')
    expect(dangerCard).toBeInTheDocument()
  })
})
