import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn.ts'

export const NavLinks = memo(function NavLinks() {
  return (
    <nav className="header__nav" role="navigation" aria-label="Main navigation">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => cn('nav-link', isActive && 'active')}
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/tasks"
        className={({ isActive }) => cn('nav-link', isActive && 'active')}
      >
        Tasks
      </NavLink>
    </nav>
  )
})
