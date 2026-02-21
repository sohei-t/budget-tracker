import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../context/ToastContext.tsx'
import { ModalProvider } from '../../context/ModalContext.tsx'
import { ThemeProvider } from '../../context/ThemeContext.tsx'
import { TaskListPage } from '../../pages/TaskListPage.tsx'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ToastProvider>
          <ModalProvider>{ui}</ModalProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('TaskListPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders task list with tasks', async () => {
    const tasksData = {
      success: true,
      data: [
        {
          id: 1,
          parent_id: null,
          level: 1,
          name: 'Project Alpha',
          description: null,
          planned_start_date: '2024-01-01',
          planned_end_date: '2024-06-30',
          planned_effort_hours: 100,
          status: 'in_progress',
          progress_percent: 45,
          progress_mode: 'auto',
          sort_order: 1,
          children_count: 2,
          cumulative_actual_hours: 45,
          delay_days: null,
          warning_level: 'none',
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(tasksData), { status: 200 })
    )

    renderWithProviders(<TaskListPage />)

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    })

    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Expand All')).toBeInTheDocument()
    expect(screen.getByText('Collapse All')).toBeInTheDocument()
  })

  it('shows empty state when no tasks', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
    )

    renderWithProviders(<TaskListPage />)

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    })
  })
})
