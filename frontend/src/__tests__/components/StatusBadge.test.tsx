import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../../components/ui/StatusBadge.tsx'

describe('StatusBadge', () => {
  it('renders Not Started status', () => {
    render(<StatusBadge status="not_started" />)
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(screen.getByText('Not Started')).toHaveClass('badge--secondary')
  })

  it('renders In Progress status', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toHaveClass('badge--primary')
  })

  it('renders Completed status', () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toHaveClass('badge--success')
  })

  it('renders On Hold status', () => {
    render(<StatusBadge status="on_hold" />)
    expect(screen.getByText('On Hold')).toBeInTheDocument()
    expect(screen.getByText('On Hold')).toHaveClass('badge--warning')
  })
})
