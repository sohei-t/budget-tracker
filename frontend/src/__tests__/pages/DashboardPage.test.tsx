import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../context/ToastContext.tsx'
import { ModalProvider } from '../../context/ModalContext.tsx'
import { ThemeProvider } from '../../context/ThemeContext.tsx'
import { DashboardPage } from '../../pages/DashboardPage.tsx'

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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows dashboard with stats after loading', async () => {
    const summaryData = {
      success: true,
      data: {
        total_tasks: 10,
        completed_tasks: 3,
        in_progress_tasks: 5,
        not_started_tasks: 2,
        overall_progress_percent: 45,
        overdue_count: 1,
        at_risk_count: 2,
        major_items: [],
      },
    }
    const delaysData = { success: true, data: [] }

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(summaryData), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(delaysData), { status: 200 }))

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows empty state on error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/Network error|No data available/)).toBeInTheDocument()
    })
  })
})
