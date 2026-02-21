import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTask } from '../api/tasks.ts'
import type { Task } from '../types/index.ts'
import { TaskForm } from '../components/task/TaskForm.tsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx'
import { useToast } from '../context/ToastContext.tsx'

export function TaskEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [task, setTask] = useState<Task | null>(null)
  const [parentTask, setParentTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getTask(id)
      .then(async (res) => {
        const t = res.data
        setTask(t)
        if (t.parent_id) {
          try {
            const pRes = await getTask(t.parent_id)
            setParentTask(pRes.data)
          } catch {
            // ignore
          }
        }
      })
      .catch((err: unknown) => {
        showToast('Failed to load task: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
        navigate('/tasks')
      })
      .finally(() => setLoading(false))
  }, [id, navigate, showToast])

  if (loading) return <LoadingSpinner />
  if (!task) return null

  return <TaskForm task={task} parentTask={parentTask} isEdit />
}
