import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
    } else {
      fetchAllListings(token);
    }
  }, [navigate]);

  const fetchAllListings = async (token) => {
    try {
      const res = await fetch('http://localhost:3000/admin/all-listings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      setListings(data.listings);
    } catch (err) {
      console.error(err);
      alert('Error fetching listings');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const statusMatch = filter === 'all' || listing.status === filter;
    const categoryMatch = categoryFilter === 'all' || listing.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const uniqueCategories = [...new Set(listings.map((l) => l.category))];

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading the admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="bg-white p-4 rounded shadow-sm">
        <h2 className="mb-4 border-bottom pb-2">Admin Dashboard</h2>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="col-md-6">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="alert alert-info text-center">No listings match the selected filters.</div>
        ) : (
          <div className="row">
            {filteredListings.map((listing) => (
              <div className="col-lg-6 mb-4" key={listing._id}>
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="card-title mb-0">{listing.title}</h5>
                      <span className={`badge bg-${listing.status === 'completed' ? 'success' : listing.status === 'pending' ? 'warning' : 'primary'}`}>{listing.status}</span>
                    </div>
                    <p className="card-text text-muted">
                      {listing.description.length > 120 ? `${listing.description.slice(0, 120)}...` : listing.description}
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-light text-dark">{listing.category}</span>
                      <small className="text-muted">
                        {listing.status === 'completed' ? '✔' : '⏳'} {new Date(listing.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
