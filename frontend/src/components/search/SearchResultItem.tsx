import { memo, useCallback } from 'react'
import type { Task } from '../../types/index.ts'
import { cn } from '../../utils/cn.ts'

interface SearchResultItemProps {
  task: Task
  isFocused: boolean
  onSelect: (taskId: number) => void
}

export const SearchResultItem = memo(function SearchResultItem({
  task,
  isFocused,
  onSelect,
}: SearchResultItemProps) {
  const handleClick = useCallback(() => {
    onSelect(task.id)
  }, [task.id, onSelect])

  return (
    <div
      className={cn('search-result-item', isFocused && 'focused')}
      role="option"
      aria-selected={isFocused}
      onClick={handleClick}
    >
      <div className="search-result-item__name">{task.name}</div>
      <div className="search-result-item__path">
        Level {task.level} &middot; {task.status}
      </div>
    </div>
  )
})
