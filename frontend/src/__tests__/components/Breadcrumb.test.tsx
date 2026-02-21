import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Breadcrumb } from '../../components/ui/Breadcrumb.tsx'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Breadcrumb', () => {
  it('renders nothing for empty items', () => {
    const { container } = renderWithRouter(<Breadcrumb items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders links and current item', () => {
    renderWithRouter(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tasks', href: '/tasks' },
          { label: 'My Task' },
        ]}
      />
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('My Task')).toHaveAttribute('aria-current', 'page')
  })

  it('renders navigation landmark', () => {
    renderWithRouter(
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Current' }]} />
    )
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
  })
})
