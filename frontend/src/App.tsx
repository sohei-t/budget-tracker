import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { ModalProvider } from './context/ModalContext.tsx'
import { Layout } from './components/layout/Layout.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { TaskListPage } from './pages/TaskListPage.tsx'
import { TaskDetailPage } from './pages/TaskDetailPage.tsx'
import { TaskNewPage } from './pages/TaskNewPage.tsx'
import { TaskEditPage } from './pages/TaskEditPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <ModalProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tasks" element={<TaskListPage />} />
                <Route path="/tasks/new" element={<TaskNewPage />} />
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
                <Route path="/tasks/:id/edit" element={<TaskEditPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </ModalProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
