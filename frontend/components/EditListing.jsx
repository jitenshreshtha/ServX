// ✅ Final EditListing.jsx (Reusable for Admin and User)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditListing({ mode = "user" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const token = localStorage.getItem(mode === "admin" ? "adminToken" : "token");
        const url = mode === "admin"
          ? `http://localhost:3000/admin/listings/${id}`
          : `http://localhost:3000/listings/${id}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Listing not found");

        setFormData({
          ...data.listing,
          tags: data.listing.tags?.join(", ") || "",
          location: {
            city: data.listing.location?.city || "",
            state: data.listing.location?.state || "",
            country: data.listing.location?.country || "",
            isRemote: data.listing.location?.isRemote || false,
          },
        });
      } catch (err) {
        alert("Error loading listing: " + err.message);
        navigate(mode === "admin" ? "/admin-dashboard" : "/my-listings");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, mode, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: type === "checkbox" ? checked : value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title?.trim()) errs.title = "Required";
    if (!formData.description?.trim()) errs.description = "Required";
    if (!formData.skillOffered?.trim()) errs.skillOffered = "Required";
    if (!formData.skillWanted?.trim()) errs.skillWanted = "Required";
    if (!formData.category?.trim()) errs.category = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem(mode === "admin" ? "adminToken" : "token");
    const url = mode === "admin"
      ? `http://localhost:3000/admin/listings/${id}`
      : `http://localhost:3000/listings/${id}`;

    const update = {
      ...formData,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(update),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      alert("Listing updated successfully!");
      navigate(mode === "admin" ? "/admin-dashboard" : "/my-listings");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error: " + err.message);
    }
  };

  if (loading || !formData) return <p>Loading listing...</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h3>Edit Listing</h3>

      <div className="mb-3">
        <label>Title</label>
        <input name="title" className={`form-control ${errors.title ? "is-invalid" : ""}`} value={formData.title} onChange={handleChange} />
        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
      </div>

      <div className="mb-3">
        <label>Description</label>
        <textarea name="description" className={`form-control ${errors.description ? "is-invalid" : ""}`} rows="3" value={formData.description} onChange={handleChange} />
        {errors.description && <div className="invalid-feedback">{errors.description}</div>}
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label>Skill Offered</label>
          <input name="skillOffered" className={`form-control ${errors.skillOffered ? "is-invalid" : ""}`} value={formData.skillOffered} onChange={handleChange} />
          {errors.skillOffered && <div className="invalid-feedback">{errors.skillOffered}</div>}
        </div>
        <div className="col-md-6 mb-3">
          <label>Skill Wanted</label>
          <input name="skillWanted" className={`form-control ${errors.skillWanted ? "is-invalid" : ""}`} value={formData.skillWanted} onChange={handleChange} />
          {errors.skillWanted && <div className="invalid-feedback">{errors.skillWanted}</div>}
        </div>
      </div>

      <div className="mb-3">
        <label>Category</label>
        <input name="category" className={`form-control ${errors.category ? "is-invalid" : ""}`} value={formData.category} onChange={handleChange} />
        {errors.category && <div className="invalid-feedback">{errors.category}</div>}
      </div>

      <div className="mb-3">
        <label>Tags (comma-separated)</label>
        <input name="tags" className="form-control" value={formData.tags} onChange={handleChange} />
      </div>

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary">Update</button>
      </div>
    </form>
  );
}

export default EditListing;
