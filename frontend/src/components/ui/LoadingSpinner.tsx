import React from 'react'

export const LoadingSpinner = React.memo(function LoadingSpinner() {
  return (
    <div className="loading-spinner active">
      <div className="spinner" aria-label="Loading" />
    </div>
  )
})
