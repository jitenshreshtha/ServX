import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateListing from './CreateListing';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Default to Overview (charts first)
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/admin-login');

    // Fetch everything for Overview
    Promise.allSettled([
      fetchAllListings(token),
      fetchAllUsers(token),
      fetchReports(token),
      fetchAllTickets(token),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Optional: refresh reports if user sits on that tab
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    if (activeTab === 'reports') fetchReports(token);
  }, [activeTab]);

  const fetchAllListings = async (token) => {
    try {
      const res = await fetch('http://localhost:3000/admin/all-listings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setListings(Array.isArray(data?.listings) ? data.listings : []);
    } catch {
      /* silent */
    }
  };

  const fetchAllUsers = async (token) => {
    try {
      const res = await fetch('http://localhost:3000/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      /* silent */
    }
  };

  const fetchReports = async (token) => {
  try {
    const res = await fetch('http://localhost:3000/admin/reported-messages', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    // Accept different response formats
    const arr =
      Array.isArray(data?.reported) ? data.reported :
      Array.isArray(data?.reports)  ? data.reports  :
      (Array.isArray(data) ? data : []);
    setReports(arr);
  } catch (err) {
    console.error("Failed to load reports:", err);
    setReports([]);
  }
};


  const fetchAllTickets = async (token) => {
    try {
      const res = await fetch('http://localhost:3000/admin/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // accept either raw array or {tickets: []}
      setTickets(Array.isArray(data?.tickets) ? data.tickets : (Array.isArray(data) ? data : []));
    } catch {
      /* silent */
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
      setUsers(prev => prev.filter(u => u._id !== id));
      fetchAllListings(token);
    } catch {
      alert("Error deleting user");
    }
  };

  const handleDeleteMessage = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`http://localhost:3000/admin/messages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(prev => prev.filter(r => r._id !== id));
    } catch {
      alert("Error deleting message");
    }
  };

  const handleDismissReport = async (id) => {
    const token = localStorage.getItem("adminToken");
    try {
      await fetch(`http://localhost:3000/admin/messages/${id}/dismiss-report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(prev => prev.filter(r => r._id !== id));
    } catch {
      alert("Error dismissing report");
    }
  };

  const uniqueCategories = useMemo(
    () => [...new Set(listings.map(l => l.category).filter(Boolean))],
    [listings]
  );

  const filteredListings = listings.filter(listing => {
    const statusMatch = filter === 'all' || listing.status === filter;
    const categoryMatch = categoryFilter === 'all' || listing.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  // ---------- Aggregations for charts ----------
  const listingStatusCounts = useMemo(() => {
    const counts = { active: 0, completed: 0, pending: 0, other: 0 };
    listings.forEach(l => {
      const s = (l.status || '').toLowerCase();
      if (s === 'active') counts.active++;
      else if (s === 'completed') counts.completed++;
      else if (s === 'pending') counts.pending++;
      else counts.other++;
    });
    return counts;
  }, [listings]);

  const userRoleCounts = useMemo(() => {
    const map = {};
    users.forEach(u => {
      const r = (u.role || 'user').toLowerCase();
      map[r] = (map[r] || 0) + 1;
    });
    return map; // e.g., {admin: 2, user: 40, moderator: 1}
  }, [users]);

  const ticketStatusCounts = useMemo(() => {
    const map = {};
    tickets.forEach(t => {
      const s = (t.status || 'unknown').toLowerCase();
      map[s] = (map[s] || 0) + 1;
    });
    return map; // e.g., {open: 3, in_progress: 2, closed: 5}
  }, [tickets]);

  // robust mapper for report reasons across shapes
  const reportReasonCounts = useMemo(() => {
    const map = {};
    reports.forEach(m => {
      const reasons = Array.isArray(m?.reports)
        ? m.reports.map(r => r?.reason ?? r?.type ?? r?.category ?? 'other')
        : [m?.reason ?? m?.reportReason ?? m?.type ?? m?.category ?? 'other'];
      reasons.forEach((reason) => {
        const key = String(reason || 'other').toLowerCase();
        map[key] = (map[key] || 0) + 1;
      });
    });
    if (Object.keys(map).length === 0 && reports.length > 0) {
      map.other = reports.length;
    }
    return map; // e.g., {spam:3, abuse:2, other:1}
  }, [reports]);

  // ---------- Reusable donut (SVG) ----------
  const Donut = ({ title, desc, counts, palette }) => {
    const entries = Object.entries(counts);
    const total = entries.reduce((acc, [, v]) => acc + v, 0); // keep 0 if no data
    const radius = 40, stroke = 12, C = 2 * Math.PI * radius;

    let acc = 0;
    const segs = total > 0
      ? entries.map(([k, v], i) => {
          const dash = (v / total) * C;
          const offset = acc; acc += dash;
          return { key: k, value: v, dash, offset, color: palette[i % palette.length] };
        })
      : [];

    return (
      <div className="d-flex align-items-center gap-4 flex-wrap">
        <figure className="mb-0" role="img" aria-labelledby={`${title}-t ${title}-d`}>
          <svg width="220" height="220" viewBox="0 0 100 100">
            <title id={`${title}-t`}>{title}</title>
            <desc id={`${title}-d`}>{desc}</desc>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#e9ecef" strokeWidth={stroke} />
            {segs.map((s, i) => (
              <circle
                key={s.key}
                cx="50" cy="50" r={radius} fill="none"
                stroke={s.color} strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-1 * segs.slice(0, i).reduce((m, p) => m + p.dash, 0)}
                transform="rotate(-90 50 50)"
              />
            ))}
            <circle cx="50" cy="50" r="28" fill="white" />
            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#212529">
              {total} total
            </text>
          </svg>
        </figure>
        <div className="flex-grow-1">
          {entries.length > 0 ? entries.map(([k, v], i) => (
            <div key={k} className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span aria-hidden="true" className="rounded-circle d-inline-block"
                  style={{ width: 12, height: 12, backgroundColor: palette[i % palette.length] }} />
                <span className="text-capitalize">{k.replace(/_/g, ' ')}</span>
              </div>
              <span className="fw-semibold">
                {v} <span className="text-body-secondary">
                  ({total > 0 ? Math.round((v / total) * 100) : 0}%)
                </span>
              </span>
            </div>
          )) : <div className="text-body-secondary">No data</div>}
        </div>
      </div>
    );
  };

  // Color palettes (Bootstrap-ish, high-contrast)
  const palettePrimary = ['#0d6efd', '#198754', '#ffc107', '#6c757d', '#dc3545', '#6610f2'];

  // AODA: label IDs
  const statusSelectId = "statusFilterSelect";
  const categorySelectId = "categoryFilterSelect";

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" aria-label="Loading"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <a href="#admin-main" className="visually-hidden-focusable">Skip to main content</a>
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 bg-light p-3 border-end min-vh-100" aria-label="Admin sidebar">
          <h5 className="mb-4">Admin Panel</h5>
          <ul className="nav flex-column gap-1">
            <li className="nav-item">
              <button
                className={`nav-link btn text-start w-100 ${activeTab === 'overview' ? 'fw-bold text-primary' : ''}`}
                onClick={() => setActiveTab('overview')}
                aria-current={activeTab === 'overview' ? 'page' : undefined}
              >
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn text-start w-100 ${activeTab === 'listings' ? 'fw-bold text-primary' : ''}`}
                onClick={() => setActiveTab('listings')}
                aria-current={activeTab === 'listings' ? 'page' : undefined}
              >
                Listings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn text-start w-100 ${activeTab === 'users' ? 'fw-bold text-primary' : ''}`}
                onClick={() => setActiveTab('users')}
                aria-current={activeTab === 'users' ? 'page' : undefined}
              >
                Users
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn text-start w-100 ${activeTab === 'reports' ? 'fw-bold text-primary' : ''}`}
                onClick={() => setActiveTab('reports')}
                aria-current={activeTab === 'reports' ? 'page' : undefined}
              >
                Reported Messages
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn text-start w-100 ${activeTab === 'tickets' ? 'fw-bold text-primary' : ''}`}
                onClick={() => setActiveTab('tickets')}
                aria-current={activeTab === 'tickets' ? 'page' : undefined}
              >
                Support Tickets
              </button>
            </li>
          </ul>
        </nav>

        {/* Main */}
        <main id="admin-main" className="col-md-9 col-lg-10 p-4">
          <h2 className="mb-4" id="pageTitle">
            {activeTab === 'overview'
              ? 'Overview'
              : activeTab === 'listings'
              ? 'Listings'
              : activeTab === 'users'
              ? 'Users'
              : activeTab === 'reports'
              ? 'Reported Messages'
              : activeTab === 'tickets'
              ? 'Support Tickets'
              : 'Admin'}
          </h2>

          {/* -------- OVERVIEW TAB: Four charts -------- */}
          {activeTab === 'overview' && (
            <div className="row g-3">
              {/* Listings by status */}
              <div className="col-12 col-xl-6">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h3 className="h5">Listings by Status</h3>
                    <p className="text-body-secondary">Current distribution of all listings</p>
                    <Donut
                      title="Listings by status"
                      desc={`Active ${listingStatusCounts.active}, Completed ${listingStatusCounts.completed}, Pending ${listingStatusCounts.pending}, Other ${listingStatusCounts.other}.`}
                      counts={listingStatusCounts}
                      palette={palettePrimary}
                    />
                  </div>
                </div>
              </div>

              {/* Tickets by status */}
              <div className="col-12 col-xl-6">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h3 className="h5">Tickets by Status</h3>
                    <p className="text-body-secondary">Open workload vs resolved items</p>
                    <Donut
                      title="Tickets by status"
                      desc={Object.entries(ticketStatusCounts).map(([k,v]) => `${k} ${v}`).join(', ') || 'No tickets'}
                      counts={ticketStatusCounts}
                      palette={palettePrimary}
                    />
                  </div>
                </div>
              </div>

              {/* Reported messages by reason */}
              <div className="col-12 col-xl-6">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h3 className="h5">Reported Messages</h3>
                        <p className="text-body-secondary mb-2">Breakdown by reason</p>
                      </div>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/admin/reported-messages')}>
                        Review
                      </button>
                    </div>
                    <Donut
                      title="Reported messages by reason"
                      desc={Object.entries(reportReasonCounts).map(([k,v]) => `${k} ${v}`).join(', ') || 'No reports'}
                      counts={reportReasonCounts}
                      palette={palettePrimary}
                    />
                  </div>
                </div>
              </div>

              {/* Users by role */}
              <div className="col-12 col-xl-6">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h3 className="h5">Users by Role</h3>
                    <p className="text-body-secondary">Access levels across the platform</p>
                    <Donut
                      title="Users by role"
                      desc={Object.entries(userRoleCounts).map(([k,v]) => `${k} ${v}`).join(', ') || 'No users'}
                      counts={userRoleCounts}
                      palette={palettePrimary}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------- LISTINGS TAB -------- */}
          {activeTab === 'listings' && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label htmlFor={statusSelectId} className="form-label">Filter by status</label>
                  <select
                    id={statusSelectId}
                    className="form-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor={categorySelectId} className="form-label">Filter by category</label>
                  <select
                    id={categorySelectId}
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

              <div className="d-flex justify-content-end mb-3">
                <button className="btn btn-success" onClick={() => setShowCreateModal(true)}>
                  + Create New Listing
                </button>
              </div>

              <div className="row">
                {filteredListings.map(listing => {
                  const badgeClass =
                    listing.status === 'active' ? 'bg-primary' :
                    listing.status === 'completed' ? 'bg-success' :
                    listing.status === 'pending' ? 'bg-warning text-dark' :
                    'bg-secondary';
                  return (
                    <div className="col-md-6 mb-4" key={listing._id}>
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start">
                            <h5 className="mb-1">{listing.title}</h5>
                            <span className={`badge ${badgeClass}`} aria-label={`Status ${listing.status}`}>
                              {listing.status}
                            </span>
                          </div>
                          <p className="mb-2">{listing.description?.slice(0, 120)}...</p>
                          <p className="mb-1"><strong>Category:</strong> {listing.category || 'N/A'}</p>
                          <p className="mb-3">
                            <strong>Author:</strong> {listing.author?.name || "N/A"} ({listing.author?.email || "N/A"})
                          </p>

                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => navigate(`/admin/edit-listing/${listing._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteListing(listing._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-label="Create listing modal">
                  <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Create Listing</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCreateModal(false)}></button>
                      </div>
                      <div className="modal-body">
                        <CreateListing
                          mode="admin"
                          onSuccess={(listing) => {
                            setListings((prev) => [listing, ...prev]);
                            setShowCreateModal(false);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* -------- USERS TAB -------- */}
          {activeTab === 'users' && (
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle table-striped table-hover">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Role</th>
                        <th scope="col" className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td><a href={`mailto:${user.email}`} className="link-body-emphasis">{user.email}</a></td>
                          <td>
                            <span className={`badge ${user.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group" role="group" aria-label={`Actions for ${user.name}`}>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/admin/edit-user/${user._id}`)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* -------- REPORTS TAB -------- */}
          {activeTab === 'reports' && (
            <div className="card shadow-sm">
              <div className="card-body">
                {reports.length === 0 ? (
                  <p className="mb-0">No reported messages.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">Sender</th>
                          <th scope="col">Message</th>
                          <th scope="col">Reason</th>
                          <th scope="col">Reported At</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((msg) => (
                          <tr key={msg._id}>
                            <td>{msg.sender?.name || 'Unknown'}</td>
                            <td className="text-break">{msg.content}</td>
                            <td>
                              {(msg.reports || []).map((r, i) => (
                                <span key={i} className="badge bg-warning text-dark me-1">{r.reason || r.type || r.category || 'other'}</span>
                              ))}
                            </td>
                            <td>{new Date(msg.createdAt).toLocaleString()}</td>
                            <td>
                              <div className="btn-group" role="group" aria-label="Report actions">
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteMessage(msg._id)}>Delete</button>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDismissReport(msg._id)}>Dismiss</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -------- TICKETS TAB -------- */}
          {activeTab === 'tickets' && (
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h3 className="h5 mb-0">Tickets</h3>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/admin/tickets')}>
                    Open Tickets Page
                  </button>
                </div>
                {tickets.length === 0 ? (
                  <p className="mb-0">No tickets yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle table-striped table-hover">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">Subject</th>
                          <th scope="col">User</th>
                          <th scope="col">Status</th>
                          <th scope="col">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map(t => (
                          <tr key={t._id}>
                            <td className="text-break">{t.subject || t.title || '—'}</td>
                            <td>{t.user?.name || 'Unknown'}</td>
                            <td>
                              <span className={`badge ${
                                (t.status || '').toLowerCase() === 'open' ? 'bg-danger' :
                                (t.status || '').toLowerCase() === 'in_progress' ? 'bg-warning text-dark' :
                                (t.status || '').toLowerCase() === 'closed' ? 'bg-success' : 'bg-secondary'
                              }`}>
                                {(t.status || 'unknown').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
