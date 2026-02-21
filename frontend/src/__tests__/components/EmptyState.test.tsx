import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../../components/ui/EmptyState.tsx'

describe('EmptyState', () => {
  it('renders icon and text', () => {
    render(<EmptyState icon="!" text="No items found" />)
    expect(screen.getByText('!')).toBeInTheDocument()
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <EmptyState icon="*" text="Empty">
        <button>Create</button>
      </EmptyState>
    )
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })
})
