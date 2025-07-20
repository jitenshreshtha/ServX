import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const EditListing = ({ mode = "user" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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

        if (res.status === 404) {
          setFormData(null);
          setLoading(false);
          return;
        }

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
        setErrorMsg("Error loading listing: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, mode, navigate]);

  // Handle form submission (same as before)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("location.")) {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [name.replace("location.", "")]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem(mode === "admin" ? "adminToken" : "token");
      const url = mode === "admin"
        ? `http://localhost:3000/admin/listings/${id}`
        : `http://localhost:3000/listings/${id}`;

      // Prepare data for backend
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update listing");

      alert("Listing updated successfully!");
      navigate(mode === "admin" ? "/admin-dashboard" : "/my-listings");
    } catch (err) {
      setErrorMsg("Error updating listing: " + err.message);
    }
  };

  if (loading) return <p>Loading listing...</p>;

  if (!formData) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h5>Listing Not Found</h5>
          <p>
            The listing you are trying to edit does not exist or has been deleted.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/my-listings")}>
            Go Back to My Listings
          </button>
        </div>
        {errorMsg && (
          <div className="alert alert-warning mt-3">
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Edit Listing</h2>
      {errorMsg && (
        <div className="alert alert-warning">{errorMsg}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Title</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Description</label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Skill Offered</label>
          <input
            type="text"
            className="form-control"
            name="skillOffered"
            value={formData.skillOffered}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Skill Wanted</label>
          <input
            type="text"
            className="form-control"
            name="skillWanted"
            value={formData.skillWanted}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label>Category</label>
          <input
            type="text"
            className="form-control"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label>Estimated Duration</label>
          <input
            type="text"
            className="form-control"
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label>Tags (comma separated)</label>
          <input
            type="text"
            className="form-control"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label>Location</label>
          <input
            type="text"
            className="form-control mb-2"
            name="location.city"
            placeholder="City"
            value={formData.location.city}
            onChange={handleChange}
          />
          <input
            type="text"
            className="form-control mb-2"
            name="location.state"
            placeholder="State"
            value={formData.location.state}
            onChange={handleChange}
          />
          <input
            type="text"
            className="form-control mb-2"
            name="location.country"
            placeholder="Country"
            value={formData.location.country}
            onChange={handleChange}
          />
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              name="location.isRemote"
              checked={formData.location.isRemote}
              onChange={handleChange}
            />
            <label className="form-check-label">Remote</label>
          </div>
        </div>
        <button className="btn btn-success" type="submit">
          Save Changes
        </button>
        <button className="btn btn-secondary ms-2" type="button" onClick={() => navigate("/my-listings")}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditListing;
