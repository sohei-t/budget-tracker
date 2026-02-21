import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from '../../types/index.ts'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export const Breadcrumb = memo(function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        if (isLast) {
          return (
            <span key={i} className="breadcrumb__item breadcrumb__item--current" aria-current="page">
              {item.label}
            </span>
          )
        }
        return (
          <span key={i}>
            <Link to={item.href ?? '/'} className="breadcrumb__item">{item.label}</Link>
            <span className="breadcrumb__separator" aria-hidden="true">/</span>
          </span>
        )
      })}
    </nav>
  )
})
