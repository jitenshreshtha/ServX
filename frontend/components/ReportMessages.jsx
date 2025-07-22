import React, { useEffect, useState } from 'react';

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
        setReports(data.reported || []);
      } catch (err) {
        console.error("Failed to load reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // PATCH endpoint for soft delete (message is marked isDeleted:true)
  const handleDelete = async (id) => {
  const token = localStorage.getItem("adminToken");
  if (!window.confirm("Delete this message?")) return;
  try {
    await fetch(`http://localhost:3000/admin/messages/${id}/delete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setReports(reports.filter((r) => r._id !== id));
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
      setReports(reports.filter((r) => r._id !== id));
    } catch {
      alert("Error dismissing report");
    }
  };

  if (loading) return <p>Loading reported messages...</p>;

  return (
    <div>
      <h2>Reported Messages</h2>
      {reports.length === 0 ? (
        <p>No reported messages.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
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
                  {msg.reports?.map((r, i) => (
                    <div key={i}>{r.reason}</div>
                  ))}
                </td>
                <td>{new Date(msg.createdAt).toLocaleString()}</td>
                <td>
                  <button className="btn btn-sm btn-danger me-2" onClick={() => handleDelete(msg._id)}>Delete</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleDismiss(msg._id)}>Dismiss</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReportedMessages;
