export default function Pagination({ page, totalPages, onChange, disabled = false }) {
  if (totalPages <= 1) return null
  return <nav className="pagination" aria-label="Record pages">
    <button className="button button-outline button-small" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
    <span>Page {page} of {totalPages}</span>
    <button className="button button-outline button-small" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
  </nav>
}
