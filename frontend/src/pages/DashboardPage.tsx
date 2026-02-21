import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard.ts'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ProgressBar } from '../components/ui/ProgressBar.tsx'
import { StatsGrid } from '../components/dashboard/StatsGrid.tsx'
import { DelayedTaskList } from '../components/dashboard/DelayedTaskList.tsx'
import { MajorItemsList } from '../components/dashboard/MajorItemsList.tsx'

export function DashboardPage() {
  const { summary, delayedTasks, loading, error } = useDashboard()

  if (loading) return <LoadingSpinner />

  if (error || !summary) {
    return (
      <div className="dashboard">
        <EmptyState icon="&#128202;" text={error || 'No data available'}>
          <Link to="/tasks/new" className="btn btn--primary btn--lg">Create First Task</Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="dashboard__title">Dashboard</h2>
        <Link to="/tasks/new" className="btn btn--primary">+ New Task</Link>
      </div>

      <StatsGrid summary={summary} />

      <div className="dashboard-section">
        <h3 className="dashboard-section__title">Overall Progress</h3>
        <div className="card">
          <ProgressBar percent={summary.overall_progress_percent} size="lg" showLabel />
        </div>
      </div>

      <DelayedTaskList tasks={delayedTasks} />
      <MajorItemsList items={summary.major_items ?? []} />
    </div>
  )
}
