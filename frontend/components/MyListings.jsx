import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateListing() {
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
      isRemote: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const categories = [
    "Web Development",
    "Mobile Development", 
    "Design",
    "Writing",
    "Marketing",
    "Photography",
    "Video Editing",
    "Tutoring",
    "Home Services",
    "Crafts",
    "Consulting",
    "Other"
  ];

  const durations = [
    "1-3 hours",
    "1 day",
    "2-3 days",
    "1 week",
    "2+ weeks"
  ];

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
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await fetch('http://localhost:3000/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }

      alert('Listing created successfully!');
      navigate('/');

    } catch (error) {
      console.error('Create listing error:', error);
      if (error.message.includes('token')) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        alert('Failed to create listing: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "800px" }}>
      <div className="card shadow">
        <div className="card-body p-4">
          <h2 className="mb-4 text-center">Create New Listing</h2>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="title" className="form-label">Title *</label>
                <input
                  type="text"
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Need a logo design for my startup"
                  required
                />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="category" className="form-label">Category *</label>
                <select
                  className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what you need and what you're offering in detail..."
                required
              />
              {errors.description && <div className="invalid-feedback">{errors.description}</div>}
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="skillOffered" className="form-label">Skill You're Offering *</label>
                <input
                  type="text"
                  className={`form-control ${errors.skillOffered ? 'is-invalid' : ''}`}
                  id="skillOffered"
                  name="skillOffered"
                  value={formData.skillOffered}
                  onChange={handleChange}
                  placeholder="e.g., Web Development"
                  required
                />
                {errors.skillOffered && <div className="invalid-feedback">{errors.skillOffered}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="skillWanted" className="form-label">Skill You Want *</label>
                <input
                  type="text"
                  className={`form-control ${errors.skillWanted ? 'is-invalid' : ''}`}
                  id="skillWanted"
                  name="skillWanted"
                  value={formData.skillWanted}
                  onChange={handleChange}
                  placeholder="e.g., Graphic Design"
                  required
                />
                {errors.skillWanted && <div className="invalid-feedback">{errors.skillWanted}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="estimatedDuration" className="form-label">Estimated Duration</label>
                <select
                  className="form-select"
                  id="estimatedDuration"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                >
                  <option value="">Select duration</option>
                  {durations.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="tags" className="form-label">Tags</label>
                <input
                  type="text"
                  className="form-control"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g., urgent, beginner-friendly, remote (comma separated)"
                />
                <div className="form-text">Enter tags separated by commas</div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label htmlFor="location.city" className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  id="location.city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="e.g., Toronto"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label htmlFor="location.state" className="form-label">State/Province</label>
                <input
                  type="text"
                  className="form-control"
                  id="location.state"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="e.g., Ontario"
                />
              </div>

              <div className="col-md-4 mb-3">
                <label htmlFor="location.country" className="form-label">Country</label>
                <input
                  type="text"
                  className="form-control"
                  id="location.country"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  placeholder="e.g., Canada"
                />
              </div>
            </div>

            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="location.isRemote"
                name="location.isRemote"
                checked={formData.location.isRemote}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="location.isRemote">
                This can be done remotely
              </label>
            </div>

            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <button 
                type="button" 
                className="btn btn-secondary me-md-2"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateListing;