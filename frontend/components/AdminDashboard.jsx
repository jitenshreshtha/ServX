// ✅ Updated AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateListing from './CreateListing';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        headers: { Authorization: `Bearer ${token}` },
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

  const handleDelete = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`http://localhost:3000/admin/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting listing");
    }
  };

  const uniqueCategories = [...new Set(listings.map((l) => l.category))];
  const filteredListings = listings.filter((listing) => {
    const statusMatch = filter === 'all' || listing.status === filter;
    const categoryMatch = categoryFilter === 'all' || listing.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

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
            <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="col-md-6">
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-end mb-3">
          <button className="btn btn-success" onClick={() => setShowCreateModal(true)}>
            + Create New Listing
          </button>
        </div>

        {filteredListings.length === 0 ? (
          <div className="alert alert-info text-center">No listings found.</div>
        ) : (
          <div className="row">
            {filteredListings.map((listing) => (
              <div className="col-md-6 mb-4" key={listing._id}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5>{listing.title}</h5>
                    <p>{listing.description?.slice(0, 120)}...</p>
                    <p><strong>Category:</strong> {listing.category}</p>
                    <p><strong>Status:</strong> {listing.status}</p>
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/admin/edit-listing/${listing._id}`)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(listing._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content p-3">
                <div className="modal-header">
                  <h5 className="modal-title">Create Listing</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body">
                  <CreateListing mode="admin" onSuccess={(listing) => {
                    setListings((prev) => [listing, ...prev]);
                    setShowCreateModal(false);
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
