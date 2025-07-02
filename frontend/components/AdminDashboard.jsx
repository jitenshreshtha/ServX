// ✅ AdminDashboard with Users merged
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateListing from './CreateListing';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');

  // Listings pagination state
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);
  const [listingsPagination, setListingsPagination] = useState(null);
  const [listingsFilter, setListingsFilter] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  
  // Users pagination state
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersPagination, setUsersPagination] = useState(null);
  const [usersFilter, setUsersFilter] = useState({
    role: 'all',
    search: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/admin-login');
    fetchAllListings(token);
    fetchAllUsers(token);
  }, [navigate]);

  const fetchAllListings = async (token) => {
    try {
      const res = await fetch('http://localhost:3000/admin/all-listings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setListings(data.listings);
    } catch (err) {
      alert('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (token) => {
    try {
      const res = await fetch('http://localhost:3000/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      alert('Failed to load users');
    }
  };

  const handleDeleteListing = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await fetch(`http://localhost:3000/admin/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(prev => prev.filter(l => l._id !== id));
    } catch {
      alert("Error deleting listing");
    }
  };

  const handleDeleteUser = async (id) => {
  const token = localStorage.getItem("adminToken");
  if (!window.confirm("Are you sure you want to delete this user?")) return;
  try {
    await fetch(`http://localhost:3000/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Refresh both users and listings
    setUsers(prev => prev.filter(u => u._id !== id));
    fetchAllListings(token); // ⬅ Refresh listings
  } catch {
    alert("Error deleting user");
  }
};


  const uniqueCategories = [...new Set(listings.map(l => l.category))];
  const filteredListings = listings.filter(listing => {
    const statusMatch = filter === 'all' || listing.status === filter;
    const categoryMatch = categoryFilter === 'all' || listing.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  if (loading) {
    return <div className="container py-5 text-center"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 bg-light p-3 border-end vh-100">
          <h5 className="mb-4">Admin Panel</h5>
          <ul className="nav flex-column">
            <li className="nav-item">
              <button className={`nav-link btn text-start w-100 ${activeTab === 'listings' ? 'fw-bold text-primary' : ''}`} onClick={() => setActiveTab('listings')}>Listings</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link btn text-start w-100 ${activeTab === 'users' ? 'fw-bold text-primary' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10 p-4">
          <h2 className="mb-4">{activeTab === 'listings' ? 'Listings' : 'Users'}</h2>

          {activeTab === 'listings' && (
            <>
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
                <button className="btn btn-success" onClick={() => setShowCreateModal(true)}>+ Create New Listing</button>
              </div>

              <div className="row">
                {filteredListings.map(listing => (
                  <div className="col-md-6 mb-4" key={listing._id}>
                    <div className="card h-100">
                      <div className="card-body">
                        <h5>{listing.title}</h5>
                        <p>{listing.description?.slice(0, 120)}...</p>
                        <p><strong>Category:</strong> {listing.category}</p>
                        <p><strong>Status:</strong> {listing.status}</p>
                        <p><strong>Author:</strong> {listing.author?.name || "N/A"} ({listing.author?.email || "N/A"})</p>

                        <div className="d-flex justify-content-end gap-2">
                          <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/admin/edit-listing/${listing._id}`)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteListing(listing._id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
            </>
          )}

          {activeTab === 'users' && (
            <div>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <button className="btn btn-sm btn-primary me-2" onClick={() => navigate(`/admin/edit-user/${user._id}`)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
