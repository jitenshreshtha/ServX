import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./admin/AdminSidebar"; // adjust path if needed

const SupportCenter = () => {
  const navigate = useNavigate();

  // User token (end-user)
  const token = localStorage.getItem("token");
  // Admin token (to decide when to show admin chrome/actions)
  const adminToken = localStorage.getItem("adminToken");

  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("http://localhost:3000/tickets/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      alert("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Ticket submitted successfully!");
        setSubject("");
        setMessage("");
        setShowForm(false);
        fetchTickets();
      } else {
        alert(data.error || "Failed to submit ticket");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  const statusBadge = (statusRaw) => {
    const s = (statusRaw || "").toLowerCase().replace(/\s+/g, "_");
    const cls =
      s === "open"
        ? "badge bg-danger"
        : s === "in_progress"
        ? "badge bg-warning text-dark"
        : s === "resolved" || s === "closed"
        ? "badge bg-success"
        : "badge bg-secondary";
    const label = (statusRaw || "unknown").replace(/_/g, " ");
    return <span className={cls}>{label}</span>;
  };

  // Layout: If admin is viewing, show the sidebar like your other admin pages
  const WithAdminShell = ({ children }) => (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2">
          <AdminSidebar active="tickets" />
        </div>
        <main className="col-md-9 col-lg-10 p-4">{children}</main>
      </div>
    </div>
  );

  const Content = (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Support Tickets</h2>

        {/* Admin sees a quick link to full admin Tickets page */}
        {adminToken && (
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => navigate("/admin/tickets")}
          >
            Open Tickets Page
          </button>
        )}
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" aria-label="Loading tickets"></div>
            </div>
          ) : (
            <>
              {tickets.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Subject</th>
                        <th scope="col">User</th>
                        <th scope="col">Status</th>
                        <th scope="col">Message</th>
                        <th scope="col">Created</th>
                        {adminToken && <th scope="col" className="text-end">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr key={ticket._id}>
                          <td className="text-break">{ticket.subject}</td>
                          <td>{ticket.user?.name || "You"}</td>
                          <td>{statusBadge(ticket.status)}</td>
                          <td className="text-break">{ticket.message}</td>
                          <td>{new Date(ticket.createdAt).toLocaleString()}</td>

                          {/* Admin can jump to edit page for a ticket */}
                          {adminToken && (
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                                aria-label={`Edit ticket ${ticket.subject || ticket._id}`}
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-0 text-body-secondary">You have no tickets yet.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* End-user ticket creation (unchanged logic) */}
      {!adminToken && (
        <>
          <div className="text-end mt-4">
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
              aria-expanded={showForm}
              aria-controls="createTicketForm"
            >
              {showForm ? "Cancel" : "Create New Ticket"}
            </button>
          </div>

          {showForm && (
            <form id="createTicketForm" className="mt-4" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="ticketSubject" className="form-label">Subject</label>
                <input
                  id="ticketSubject"
                  type="text"
                  className="form-control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="ticketMessage" className="form-label">Message</label>
                <textarea
                  id="ticketMessage"
                  className="form-control"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <button type="submit" className="btn btn-success">Submit Ticket</button>
            </form>
          )}
        </>
      )}
    </>
  );

  // If adminToken exists, render with sidebar shell; otherwise, keep simple user view
  return adminToken ? <WithAdminShell>{Content}</WithAdminShell> : <div className="container py-4">{Content}</div>;
};

export default SupportCenter;
