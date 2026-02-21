import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../../components/ui/ProgressBar.tsx'

describe('ProgressBar', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar percent={75} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('clamps to 0-100 range', () => {
    const { rerender } = render(<ProgressBar percent={-10} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')

    rerender(<ProgressBar percent={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('handles null percent', () => {
    render(<ProgressBar percent={null} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('hides label when showLabel is false', () => {
    render(<ProgressBar percent={50} showLabel={false} />)
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('applies lg size class', () => {
    render(<ProgressBar percent={50} size="lg" />)
    expect(screen.getByRole('progressbar')).toHaveClass('progress-bar--lg')
  })

  it('applies danger fill class for red warning', () => {
    const { container } = render(<ProgressBar percent={50} warning="red" />)
    const fill = container.querySelector('.progress-bar__fill')
    expect(fill).toHaveClass('progress-bar__fill--danger')
  })

  it('applies warning fill class for yellow warning', () => {
    const { container } = render(<ProgressBar percent={50} warning="yellow" />)
    const fill = container.querySelector('.progress-bar__fill')
    expect(fill).toHaveClass('progress-bar__fill--warning')
  })

  it('applies success fill class at 100%', () => {
    const { container } = render(<ProgressBar percent={100} />)
    const fill = container.querySelector('.progress-bar__fill')
    expect(fill).toHaveClass('progress-bar__fill--success')
  })
})
