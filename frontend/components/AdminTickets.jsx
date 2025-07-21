
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return navigate("/admin-login");
    fetchTickets(token);
  }, [navigate]);

  const fetchTickets = async (token) => {
    try {
      const res = await fetch("http://localhost:3000/admin/tickets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      alert("Failed to load tickets");
    }
  };

  const updateStatus = async (id, newStatus) => {
    const token = localStorage.getItem("adminToken");
    await fetch(`http://localhost:3000/admin/tickets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    setTickets(tickets.map(t => t._id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTicket = async (id) => {
    const token = localStorage.getItem("adminToken");
    if (!window.confirm("Delete this ticket?")) return;
    await fetch(`http://localhost:3000/admin/tickets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setTickets(tickets.filter(t => t._id !== id));
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Support Tickets</h2>
      {tickets.length === 0 ? (
        <p>No tickets yet.</p>
      ) : (
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>User</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket._id}>
                <td>{ticket.user?.email}</td>
                <td>{ticket.subject}</td>
                <td>
                  <select
                    className="form-select"
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket._id, e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
                <td>{ticket.message}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTicket(ticket._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminTickets;
