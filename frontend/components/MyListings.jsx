import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed, cancelled
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first!');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/my-listings', {
        headers: {
          'Authorization': `Bearer ${token}`
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
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      alert('Failed to load your listings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    return listing.status === filter;
  });

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

  if (loading) {
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>My Listings</h2>
          <p className="text-muted">Manage your skill exchange listings</p>
        </div>
        <Link to="/create-listing" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Create New Listing
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All ({listings.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('active')}
            >
              Active ({listings.filter(l => l.status === 'active').length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('in_progress')}
            >
              In Progress ({listings.filter(l => l.status === 'in_progress').length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({listings.filter(l => l.status === 'completed').length})
            </button>
          </div>
        </div>
      </div>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-list-ul display-1 text-muted"></i>
          <h4 className="mt-3">
            {filter === 'all' ? 'No listings yet' : `No ${filter.replace('_', ' ')} listings`}
          </h4>
          <p className="text-muted">
            {filter === 'all' 
              ? "You haven't created any listings yet. Start by creating your first listing!"
              : `You don't have any ${filter.replace('_', ' ')} listings.`
            }
          </p>
          {filter === 'all' && (
            <Link to="/create-listing" className="btn btn-primary mt-3">
              <i className="bi bi-plus-circle me-2"></i>Create Your First Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="row">
          {filteredListings.map((listing) => (
            <div className="col-lg-6 mb-4" key={listing._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">{listing.title}</h5>
                    <span className={getStatusBadge(listing.status)}>
                      {listing.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="card-text text-muted">
                    {listing.description.length > 120 
                      ? listing.description.substring(0, 120) + '...' 
                      : listing.description}
                  </p>
                  
                  <div className="row mb-3">
                    <div className="col-6">
                      <small className="text-muted">Offering:</small>
                      <div className="fw-bold text-success">{listing.skillOffered}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Seeking:</small>
                      <div className="fw-bold text-primary">{listing.skillWanted}</div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-light text-dark">{listing.category}</span>
                    {listing.estimatedDuration && (
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>{listing.estimatedDuration}
                      </small>
                    )}
                  </div>

                  {listing.tags && listing.tags.length > 0 && (
                    <div className="mb-3">
                      {listing.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="badge bg-secondary me-1 mb-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <small className="text-muted">Created: {formatDate(listing.createdAt)}</small>
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
                    <button className="btn btn-outline-secondary btn-sm flex-fill">
                      <i className="bi bi-pencil me-1"></i>Edit
                    </button>
                    {listing.status === 'active' && (
                      <button className="btn btn-outline-danger btn-sm">
                        <i className="bi bi-pause me-1"></i>Pause
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;