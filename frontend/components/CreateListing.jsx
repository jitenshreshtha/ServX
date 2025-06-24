// ✅ FULL UPDATED CreateListing.jsx with location fields
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateListing({ mode = "user", onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillOffered: "",
    skillWanted: "",
    category: "",
    estimatedDuration: "",
    tags: "",
    location: {
      city: "",
      state: "",
      country: "",
      isRemote: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const categories = [
    "Web Development", "Mobile Development", "Design", "Writing", "Marketing",
    "Photography", "Video Editing", "Tutoring", "Home Services", "Crafts", "Consulting", "Other"
  ];
  const durations = ["1-3 hours", "1 day", "2-3 days", "1 week", "2+ weeks"];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.skillOffered.trim()) newErrors.skillOffered = "Offered skill is required";
    if (!formData.skillWanted.trim()) newErrors.skillWanted = "Wanted skill is required";
    if (!formData.category) newErrors.category = "Category is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem(mode === "admin" ? "adminToken" : "token");
    if (!token) {
      alert("Please login first");
      if (mode === "user") navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag),
      };

      const url = mode === "admin" ? "http://localhost:3000/admin/listings" : "http://localhost:3000/listings";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create listing");

      if (onSuccess) onSuccess(data.listing);
      if (mode === "user") {
        alert("Listing created successfully!");
        navigate("/");
      }
    } catch (error) {
      console.error("Create listing error:", error);
      alert("Failed to create listing: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("location.")) {
      const locationField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <h5 className="mb-3">{mode === "admin" ? "Create New Listing as Admin" : "Create New Listing"}</h5>

      <div className="mb-3">
        <label className="form-label">Title *</label>
        <input type="text" className={`form-control ${errors.title ? "is-invalid" : ""}`} name="title" value={formData.title} onChange={handleChange} required />
        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Description *</label>
        <textarea className={`form-control ${errors.description ? "is-invalid" : ""}`} name="description" value={formData.description} onChange={handleChange} rows="3" required></textarea>
        {errors.description && <div className="invalid-feedback">{errors.description}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Category *</label>
        <select className={`form-select ${errors.category ? "is-invalid" : ""}`} name="category" value={formData.category} onChange={handleChange} required>
          <option value="">Select a category</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {errors.category && <div className="invalid-feedback">{errors.category}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Skill Offered *</label>
        <input type="text" className={`form-control ${errors.skillOffered ? "is-invalid" : ""}`} name="skillOffered" value={formData.skillOffered} onChange={handleChange} required />
        {errors.skillOffered && <div className="invalid-feedback">{errors.skillOffered}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Skill Wanted *</label>
        <input type="text" className={`form-control ${errors.skillWanted ? "is-invalid" : ""}`} name="skillWanted" value={formData.skillWanted} onChange={handleChange} required />
        {errors.skillWanted && <div className="invalid-feedback">{errors.skillWanted}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Estimated Duration</label>
        <select className="form-select" name="estimatedDuration" value={formData.estimatedDuration} onChange={handleChange}>
          <option value="">Select duration</option>
          {durations.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Tags</label>
        <input type="text" className="form-control" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g., remote, urgent" />
      </div>

      <h6 className="mt-4">Location</h6>
      <div className="mb-3">
        <label className="form-label">City</label>
        <input type="text" className="form-control" name="location.city" value={formData.location.city} onChange={handleChange} />
      </div>
      <div className="mb-3">
        <label className="form-label">State</label>
        <input type="text" className="form-control" name="location.state" value={formData.location.state} onChange={handleChange} />
      </div>
      <div className="mb-3">
        <label className="form-label">Country</label>
        <input type="text" className="form-control" name="location.country" value={formData.location.country} onChange={handleChange} />
      </div>
      <div className="form-check mb-3">
        <input className="form-check-input" type="checkbox" name="location.isRemote" id="remoteCheck" checked={formData.location.isRemote} onChange={handleChange} />
        <label className="form-check-label" htmlFor="remoteCheck">
          Remote Friendly
        </label>
      </div>

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : mode === "admin" ? "Create Listing" : "Submit Listing"}
        </button>
      </div>
    </form>
  );
}

export default CreateListing;
