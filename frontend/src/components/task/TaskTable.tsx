import { useCallback, useMemo } from 'react'
import type { Task } from '../../types/index.ts'
import { TaskRow } from './TaskRow.tsx'

interface TaskTableProps {
  tasks: Task[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
}

function buildVisibleRows(
  tasks: Task[],
  expandedIds: Set<string>
): Task[] {
  const topLevel = tasks.filter(t => !t.parent_id)
  const rows: Task[] = []

  for (const task of topLevel) {
    rows.push(task)
    if (expandedIds.has(String(task.id))) {
      const children = tasks.filter(t => t.parent_id === task.id)
      for (const child of children) {
        rows.push(child)
        if (expandedIds.has(String(child.id))) {
          const grandchildren = tasks.filter(t => t.parent_id === child.id)
          for (const gc of grandchildren) {
            rows.push(gc)
          }
        }
      }
    }
  }

  return rows
}

export function TaskTable({ tasks, expandedIds, onToggle }: TaskTableProps) {
  const visibleRows = useMemo(
    () => buildVisibleRows(tasks, expandedIds),
    [tasks, expandedIds]
  )

  const handleToggle = useCallback(
    (id: string) => {
      onToggle(id)
    },
    [onToggle]
  )

  return (
    <div className="task-table" role="table" aria-label="Task list">
      <div className="task-table__header" role="row">
        <div role="columnheader">Name</div>
        <div role="columnheader">Status</div>
        <div role="columnheader">Progress</div>
        <div role="columnheader">Schedule</div>
        <div role="columnheader">Alert</div>
      </div>
      <div>
        {visibleRows.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            isExpanded={expandedIds.has(String(task.id))}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
