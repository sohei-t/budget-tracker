import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TaskRow } from '../../components/task/TaskRow.tsx'
import type { Task } from '../../types/index.ts'

const mockTask: Task = {
  id: 1,
  parent_id: null,
  level: 1,
  name: 'Test Task',
  description: null,
  planned_start_date: '2024-01-01',
  planned_end_date: '2024-06-30',
  planned_effort_hours: 100,
  status: 'in_progress',
  progress_percent: 50,
  progress_mode: 'auto',
  sort_order: 1,
  children_count: 2,
  cumulative_actual_hours: 50,
  delay_days: null,
  warning_level: 'none',
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TaskRow', () => {
  it('renders task name', () => {
    renderWithRouter(<TaskRow task={mockTask} isExpanded={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    renderWithRouter(<TaskRow task={mockTask} isExpanded={false} onToggle={vi.fn()} />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('shows toggle button for tasks with children', () => {
    renderWithRouter(<TaskRow task={mockTask} isExpanded={false} onToggle={vi.fn()} />)
    expect(screen.getByLabelText('Toggle children')).toBeInTheDocument()
  })

  it('does not show toggle button for leaf tasks', () => {
    const leafTask = { ...mockTask, children_count: 0 }
    renderWithRouter(<TaskRow task={leafTask} isExpanded={false} onToggle={vi.fn()} />)
    expect(screen.queryByLabelText('Toggle children')).not.toBeInTheDocument()
  })

  it('calls onToggle when toggle button is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderWithRouter(<TaskRow task={mockTask} isExpanded={false} onToggle={onToggle} />)

    await user.click(screen.getByLabelText('Toggle children'))
    expect(onToggle).toHaveBeenCalledWith('1')
  })

  it('applies level class', () => {
    const { container } = renderWithRouter(
      <TaskRow task={mockTask} isExpanded={false} onToggle={vi.fn()} />
    )
    expect(container.querySelector('.task-row--level-1')).toBeInTheDocument()
  })
})
