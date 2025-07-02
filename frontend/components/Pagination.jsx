import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange, loading = false, showInfo = true }) {
  // Don't show pagination if there's only one page or less
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate start and end pages
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    // Add page numbers to range
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if needed
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add the range
    rangeWithDots.push(...range);

    // Add last page and dots if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="d-flex justify-content-center align-items-center mt-4 mb-3">
      <nav aria-label="Pagination navigation">
        <ul className="pagination mb-0">
          {/* First Page Button */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || loading}
              aria-label="Go to first page"
              title="First page"
            >
              <i className="bi bi-chevron-double-left"></i>
            </button>
          </li>

          {/* Previous Button */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              aria-label="Previous page"
              title="Previous page"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {/* Page Numbers */}
          {pageNumbers.map((pageNum, index) => (
            <li key={index} className={`page-item ${pageNum === currentPage ? 'active' : ''} ${pageNum === '...' ? 'disabled' : ''}`}>
              {pageNum === '...' ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={pageNum === currentPage ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              )}
            </li>
          ))}

          {/* Next Button */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              aria-label="Next page"
              title="Next page"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>

          {/* Last Page Button */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || loading}
              aria-label="Go to last page"
              title="Last page"
            >
              <i className="bi bi-chevron-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>

      {/* Page Info */}
      {showInfo && (
        <div className="ms-3 text-muted">
          <small>
            Page {currentPage} of {totalPages}
            {loading && (
              <span className="ms-2">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </span>
            )}
          </small>
        </div>
      )}
    </div>
  );
}

export default Pagination;