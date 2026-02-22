import { useSearchParams } from 'react-router-dom'
import { TaskForm } from '../components/task/TaskForm.tsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx'
import { useParentTask } from '../hooks/useParentTask.ts'

export function TaskNewPage() {
  const [searchParams] = useSearchParams()
  const parentId = searchParams.get('parent')
  const { parentTask, loading } = useParentTask(parentId)

  if (loading) return <LoadingSpinner />

  return <TaskForm parentTask={parentTask} isEdit={false} />
}
