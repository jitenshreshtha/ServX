import React, { useState, useEffect } from "react";

const SupportCenter = () => {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    fetchTickets();
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject, message })
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

  return (
    <div className="container py-4">
      <h2>Support Center</h2>

      {loading ? (
        <div>Loading tickets...</div>
      ) : (
        <>
          {tickets.length > 0 && (
            <>
              <h4 className="mt-4">Your Tickets</h4>
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Message</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td>{ticket.subject}</td>
                      <td>{ticket.status}</td>
                      <td>{ticket.message}</td>
                      <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="text-end mt-4">
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "Create New Ticket"}
            </button>
          </div>

          {showForm && (
            <form className="mt-4" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-control"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea
                  className="form-control"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-success">Submit Ticket</button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default SupportCenter;
