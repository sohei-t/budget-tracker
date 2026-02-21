import { Outlet } from 'react-router-dom'
import { Header } from './Header.tsx'
import { ToastContainer } from '../ui/Toast.tsx'
import { Modal } from '../ui/Modal.tsx'
import { ErrorBoundary } from '../ui/ErrorBoundary.tsx'

export function Layout() {
  return (
    <div id="app">
      <Header />
      <main className="main" role="main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <ToastContainer />
      <Modal />
    </div>
  )
}
