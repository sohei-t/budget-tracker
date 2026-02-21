import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModalProvider, useModal } from '../../context/ModalContext.tsx'
import { Modal } from '../../components/ui/Modal.tsx'

function TestModalTrigger({ onResult }: { onResult: (result: boolean) => void }) {
  const { showConfirm } = useModal()
  return (
    <>
      <button
        onClick={async () => {
          const result = await showConfirm({
            title: 'Confirm Action',
            message: 'Are you sure?',
            confirmText: 'Yes',
            cancelText: 'No',
          })
          onResult(result)
        }}
      >
        Open Modal
      </button>
      <Modal />
    </>
  )
}

describe('Modal', () => {
  it('shows modal and confirms', async () => {
    const user = userEvent.setup()
    let result: boolean | undefined
    render(
      <ModalProvider>
        <TestModalTrigger onResult={r => { result = r }} />
      </ModalProvider>
    )

    await user.click(screen.getByText('Open Modal'))
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()

    await user.click(screen.getByText('Yes'))
    expect(result).toBe(true)
  })

  it('shows modal and cancels', async () => {
    const user = userEvent.setup()
    let result: boolean | undefined
    render(
      <ModalProvider>
        <TestModalTrigger onResult={r => { result = r }} />
      </ModalProvider>
    )

    await user.click(screen.getByText('Open Modal'))
    await user.click(screen.getByText('No'))
    expect(result).toBe(false)
  })
})
