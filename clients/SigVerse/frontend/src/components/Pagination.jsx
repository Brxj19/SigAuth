export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemLabel = 'items',
  onPageChange
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const startPage = Math.max(1, currentPage - 1);
  const endPage = Math.min(totalPages, currentPage + 1);

  if (startPage > 1) pages.push(1);
  if (startPage > 2) pages.push('start-ellipsis');
  for (let page = startPage; page <= endPage; page += 1) pages.push(page);
  if (endPage < totalPages - 1) pages.push('end-ellipsis');
  if (endPage < totalPages) pages.push(totalPages);

  return (
    <div className="pagination-shell">
      <span className="pagination-summary">
        Page {currentPage} of {totalPages}
        {typeof totalItems === 'number' ? ` • ${totalItems} ${itemLabel}` : ''}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {pages.map((page) => (
          page === 'start-ellipsis' || page === 'end-ellipsis' ? (
            <span key={page} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={page}
              type="button"
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        ))}
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
