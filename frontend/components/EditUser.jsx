import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`http://localhost:3000/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const targetUser = data.users.find((u) => u._id === id);
        if (!targetUser) throw new Error("User not found");
        setUser(targetUser);
      } catch (err) {
        alert("Failed to load user");
        navigate("/admin-dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:3000/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error("Update failed");
      alert("User updated successfully");
      navigate("/admin-dashboard");

    } catch (err) {
      alert(err.message);
    }
  };

  if (loading || !user) return <p>Loading user...</p>;

  return (
    <div className="container">
      <button className="btn btn-secondary mb-3" onClick={() => navigate("/admin-dashboard")}>← Back to Admin Dashboard</button>
      <form onSubmit={handleSubmit}>
        <h3>Edit User</h3>
        <div className="mb-3">
          <label>Name</label>
          <input className="form-control" name="name" value={user.name} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input className="form-control" name="email" value={user.email} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label>Role</label>
          <select className="form-select" name="role" value={user.role} onChange={handleChange}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button className="btn btn-success" type="submit">Save</button>
      </form>
    </div>
  );
};

export default EditUser;