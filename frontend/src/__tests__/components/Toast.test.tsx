import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '../../context/ToastContext.tsx'
import { ToastContainer } from '../../components/ui/Toast.tsx'

function TestToastTrigger() {
  const { showToast } = useToast()
  return (
    <>
      <button onClick={() => showToast('Test message', 'success', 0)}>Show Toast</button>
      <ToastContainer />
    </>
  )
}

describe('Toast', () => {
  it('shows and dismisses toast', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestToastTrigger />
      </ToastProvider>
    )

    await user.click(screen.getByText('Show Toast'))
    expect(screen.getByText('Test message')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Close notification'))
    expect(screen.queryByText('Test message')).not.toBeInTheDocument()
  })
})
