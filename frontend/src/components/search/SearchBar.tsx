import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../../hooks/useSearch.ts'
import { getTasks } from '../../api/tasks.ts'
import type { Task } from '../../types/index.ts'
import { SearchResultItem } from './SearchResultItem.tsx'

interface SearchBarProps {
  isOpen: boolean
  onToggle: () => void
}

export function SearchBar({ isOpen, onToggle }: SearchBarProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const { query, setQuery, results, focusIndex, moveFocus } = useSearch(tasks)

  useEffect(() => {
    if (isOpen) {
      getTasks()
        .then(res => setTasks(res.data ?? []))
        .catch(() => {})
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen, setQuery])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onToggle()
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen, onToggle])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveFocus('down')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveFocus('up')
      } else if (e.key === 'Enter' && focusIndex >= 0 && results[focusIndex]) {
        e.preventDefault()
        navigate(`/tasks/${results[focusIndex].id}`)
        onToggle()
      } else if (e.key === 'Escape') {
        onToggle()
      }
    },
    [focusIndex, results, navigate, onToggle, moveFocus]
  )

  const handleSelect = useCallback(
    (taskId: number) => {
      navigate(`/tasks/${taskId}`)
      onToggle()
    },
    [navigate, onToggle]
  )

  return (
    <div className="search-container" ref={dropdownRef}>
      <button
        className="btn btn--icon"
        aria-label="Search"
        title="Search (Ctrl+K)"
        onClick={e => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      {isOpen && (
        <div className="search-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="search-results" role="listbox">
            {query.length > 0 && results.length === 0 && (
              <div className="search-result-item text-muted">No results found</div>
            )}
            {results.map((task, i) => (
              <SearchResultItem
                key={task.id}
                task={task}
                isFocused={i === focusIndex}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
