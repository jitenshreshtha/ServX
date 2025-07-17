import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Pagination from './Pagination';

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState(null);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyListings();
  }, [currentPage, filter, searchTerm, sortBy, sortOrder]);

  const fetchMyListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first!');
        navigate('/login');
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage);
      queryParams.append('limit', itemsPerPage);
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);

      // Services tab - only show services
      if (filter === 'services') {
        queryParams.append('isService', 'true');
      } 
      // Other tabs - exclude services unless in 'all' filter
      else if (filter !== 'all') {
        queryParams.append('status', filter);
        queryParams.append('isService', 'false');
      }

      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      const url = `http://localhost:3000/my-listings?${queryParams}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isLoggedIn');
          navigate('/login');
          return;
        }
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      if (data && data.listings !== undefined) {
        setListings(data.listings || []);
        setPagination(data.pagination);
        setTotalPages(data.pagination?.pages || 1);
        setDebugInfo(data.debug || null);
      } else {
        setError('Unexpected response format from server');
        setListings([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.message);
      setListings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const moveToService = async (id) => {
    const minInput = window.prompt('Enter minimum pay for this service:');
    if (minInput === null) return;
    const maxInput = window.prompt('Enter maximum pay for this service:');
    if (maxInput === null) return;

    const salaryMin = parseFloat(minInput);
    const salaryMax = parseFloat(maxInput);
    if (isNaN(salaryMin) || isNaN(salaryMax)) {
      alert('Please enter valid numbers for pay range.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/listings/${id}/move-to-service`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ salaryMin, salaryMax })
      });
      const data = await res.json();
      if (data.success) {
        fetchMyListings();
      } else {
        alert(data.error || 'Could not move to services.');
      }
    } catch (err) {
      console.error('Error moving to service:', err);
      alert('Error moving to services');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-success',
      in_progress: 'bg-warning',
      completed: 'bg-primary',
      cancelled: 'bg-secondary'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilterCounts = () => {
    const counts = {
      all: pagination?.total || 0,
      active: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      services: 0
    };
    
    // If we have pagination data with counts, use that
    if (pagination?.counts) {
      return {
        ...counts,
        ...pagination.counts
      };
    }
    
    // Fallback to client-side counting if pagination.counts isn't available
    listings.forEach(listing => {
      if (listing.isService) {
        counts.services++;
      } else if (counts[listing.status] !== undefined) {
        counts[listing.status]++;
      }
    });
    
    return counts;
  };

  const counts = getFilterCounts();

  if (loading && currentPage === 1) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>My Listings</h2>
          <p className="text-muted mb-0">Manage your skill exchange listings</p>
          {pagination && (
            <small className="text-muted">
              Showing {pagination.showing.start}-{pagination.showing.end} of {pagination.total} listings
            </small>
          )}
        </div>
        <Link to="/create-listing" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Create New Listing
        </Link>
      </div>

      {debugInfo && (
        <div className="alert alert-info mb-4">
          <h6>🔍 Debug Information:</h6>
          <small>
            <strong>User ID:</strong> {debugInfo.userId} (Type: {debugInfo.userIdType})<br />
            <strong>Total User Listings in DB:</strong> {debugInfo.totalUserListings}<br />
            <strong>Current Filter Results:</strong> {listings.length}<br />
            <strong>Filter Used:</strong> {JSON.stringify(debugInfo.filterUsed)}
          </small>
          <button
            className="btn btn-sm btn-outline-info ms-3"
            onClick={() => setDebugInfo(null)}
          >
            Hide Debug
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <h6>❌ Error occurred:</h6>
          <small>{error}</small>
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchMyListings}>
            🔄 Retry
          </button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search your listings..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button className="btn btn-outline-secondary" type="button" onClick={clearSearch}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Date Created</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                  <option value="views">Views</option>
                </select>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <i className={`bi bi-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('all')}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('active')}
            >
              Active ({counts.active})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('in_progress')}
            >
              In Progress ({counts.in_progress})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('completed')}
            >
              Completed ({counts.completed})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'cancelled' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('cancelled')}
            >
              Cancelled ({counts.cancelled})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'services' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('services')}
            >
              Services ({counts.services})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-list-ul display-1 text-muted"></i>
          <h4 className="mt-3">
            {searchTerm ? 'No matching listings found' : 
              filter === 'all' ? 'No listings yet' : filter === 'services' ? 'No services yet' : 
              `No ${filter.replace('_', ' ')} listings`}
          </h4>
          <p className="text-muted">
            {searchTerm ? `No listings match "${searchTerm}".` : 
              filter === 'all' ? "You haven't created any listings yet." : 
              filter === 'services' ? "You haven't moved any listings to services yet." : 
              `You don't have any ${filter.replace('_', ' ')} listings.`}
          </p>
          <Link to="/create-listing" className="btn btn-primary mt-3">
            <i className="bi bi-plus-circle me-2"></i>Create Your First Listing
          </Link>
        </div>
      ) : (
        <>
          <div className="row">
            {listings.map((listing) => (
              <div className="col-lg-6 mb-4" key={listing._id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{listing.title}</h5>
                      <span className={getStatusBadge(listing.status)}>
                        {listing.status?.replace('_', ' ') || 'active'}
                      </span>
                    </div>

                    {listing.isService && (
                      <div className="mb-2">
                        <strong>Pay Range:</strong> ${listing.salaryMin} - ${listing.salaryMax}
                      </div>
                    )}

                    <p className="card-text text-muted">
                      {listing.description && listing.description.length > 120
                        ? listing.description.substring(0, 120) + '...'
                        : listing.description || 'No description'}
                    </p>

                    <div className="row mb-3">
                      <div className="col-6">
                        <small className="text-muted">Offering:</small>
                        <div className="fw-bold text-success">{listing.skillOffered || 'N/A'}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Seeking:</small>
                        <div className="fw-bold text-primary">{listing.skillWanted || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-light text-dark">{listing.category || 'Other'}</span>
                      {listing.estimatedDuration && (
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>{listing.estimatedDuration}
                        </small>
                      )}
                    </div>

                    {listing.tags && listing.tags.length > 0 && (
                      <div className="mb-3">
                        {listing.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="badge bg-secondary me-1 mb-1">
                            {tag}
                          </span>
                        ))}
                        {listing.tags.length > 3 && (
                          <span className="badge bg-light text-dark">
                            +{listing.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <small className="text-muted">
                          Created: {formatDate(listing.createdAt || new Date())}
                        </small>
                        {listing.views > 0 && (
                          <>
                            <br />
                            <small className="text-muted">
                              <i className="bi bi-eye me-1"></i>{listing.views} views
                            </small>
                          </>
                        )}
                      </div>
                      <div>
                        {listing.location?.isRemote && (
                          <span className="badge bg-info me-2">Remote</span>
                        )}
                        {listing.applicants && listing.applicants.length > 0 && (
                          <span className="badge bg-warning">
                            {listing.applicants.length} applicant{listing.applicants.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent">
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm flex-fill">
                        <i className="bi bi-eye me-1"></i>View
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={() => navigate(`/edit-listing/${listing._id}`)}
                      >
                        <i className="bi bi-pencil me-1"></i>Edit
                      </button>
                      {(!listing.status || listing.status === 'active') && !listing.isService && (
                        <button
                          className="btn btn-outline-warning btn-sm flex-fill"
                          onClick={() => moveToService(listing._id)}
                        >
                          <i className="bi bi-arrow-repeat me-1"></i>Move to Services
                        </button>
                      )}
                      {(!listing.status || listing.status === 'active') && (
                        <button className="btn btn-outline-danger btn-sm flex-fill">
                          <i className="bi bi-pause me-1"></i>Pause
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}

export default MyListings;