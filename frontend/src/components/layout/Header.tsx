import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavLinks } from './NavLinks.tsx'
import { SearchBar } from '../search/SearchBar.tsx'
import { ShortcutsDialog } from './ShortcutsDialog.tsx'
import { useTheme } from '../../context/ThemeContext.tsx'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.ts'

export function Header() {
  const { toggleTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const onToggleSearch = useCallback(() => {
    setSearchOpen(prev => !prev)
  }, [])

  const onToggleShortcuts = useCallback(() => {
    setShortcutsOpen(prev => !prev)
  }, [])

  useKeyboardShortcuts({ onToggleSearch, onToggleShortcuts })

  return (
    <>
      <header className="header" role="banner">
        <div className="header__left">
          <Link to="/dashboard" className="header__logo" aria-label="Dashboard">
            <span className="header__logo-icon" aria-hidden="true">&#9776;</span>
            <h1 className="header__title">Budget Tracker</h1>
          </Link>
        </div>
        <NavLinks />
        <div className="header__right">
          <SearchBar isOpen={searchOpen} onToggle={onToggleSearch} />
          <button
            className="btn btn--icon"
            aria-label="Toggle dark mode"
            title="Toggle dark mode (Ctrl+D)"
            onClick={toggleTheme}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
          <button
            className="btn btn--icon"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            onClick={onToggleShortcuts}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="6" y1="8" x2="6" y2="8" />
              <line x1="10" y1="8" x2="10" y2="8" />
              <line x1="14" y1="8" x2="14" y2="8" />
              <line x1="18" y1="8" x2="18" y2="8" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </header>
      {shortcutsOpen && <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />}
    </>
  )
}
