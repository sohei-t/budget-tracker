import { memo, type ReactNode } from 'react'

interface EmptyStateProps {
  icon: string
  text: string
  children?: ReactNode
}

export const EmptyState = memo(function EmptyState({ icon, text, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <div className="empty-state__text">{text}</div>
      {children}
    </div>
  )
})
