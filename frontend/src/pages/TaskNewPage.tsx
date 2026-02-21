import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTask } from '../api/tasks.ts'
import type { Task } from '../types/index.ts'
import { TaskForm } from '../components/task/TaskForm.tsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx'

export function TaskNewPage() {
  const [searchParams] = useSearchParams()
  const parentId = searchParams.get('parent')
  const [parentTask, setParentTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(!!parentId)

  useEffect(() => {
    if (parentId) {
      getTask(parentId)
        .then(res => setParentTask(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [parentId])

  if (loading) return <LoadingSpinner />

  return <TaskForm parentTask={parentTask} isEdit={false} />
}
