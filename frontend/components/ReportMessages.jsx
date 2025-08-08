import React, { useEffect, useState } from 'react';
import AdminSidebar from './admin/AdminSidebar';

const ReportedMessages = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("http://localhost:3000/admin/reported-messages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const arr =
          Array.isArray(data?.reported) ? data.reported :
          Array.isArray(data?.reports)  ? data.reports  :
          (Array.isArray(data) ? data : []);
        setReports(arr);
      } catch (err) {
        console.error("Failed to load reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDelete = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`http://localhost:3000/admin/messages/${id}/delete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(prev => prev.filter((r) => r._id !== id));
    } catch {
      alert("Error deleting message");
    }
  };

  const handleDismiss = async (id) => {
    const token = localStorage.getItem("adminToken");
    try {
      await fetch(`http://localhost:3000/admin/messages/${id}/dismiss-report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(prev => prev.filter((r) => r._id !== id));
    } catch {
      alert("Error dismissing report");
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2">
          <AdminSidebar active="reports" />
        </div>

        {/* Main */}
        <main className="col-md-9 col-lg-10 p-4">
          <h2 className="mb-4">Reported Messages</h2>
          <div className="card shadow-sm">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                </div>
              ) : reports.length === 0 ? (
                <p>No reported messages.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Sender</th>
                        <th>Message</th>
                        <th>Reason</th>
                        <th>Reported At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((msg) => (
                        <tr key={msg._id}>
                          <td>{msg.sender?.name || 'Unknown'}</td>
                          <td>{msg.content}</td>
                          <td>
                            {(msg.reports || []).map((r, i) => (
                              <span key={i} className="badge bg-warning text-dark me-1">
                                {r.reason || 'Other'}
                              </span>
                            ))}
                          </td>
                          <td>{new Date(msg.createdAt).toLocaleString()}</td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(msg._id)}>Delete</button>
                              <button className="btn btn-sm btn-secondary" onClick={() => handleDismiss(msg._id)}>Dismiss</button>
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
        </main>
      </div>
    </div>
  );
};

export default ReportedMessages;
