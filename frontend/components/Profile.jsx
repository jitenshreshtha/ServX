import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import ReviewDisplay from './ReviewDisplay';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: '',
    bio: '',
    location: {
      city: '',
      state: '',
      country: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
   
    if (user?._id) {
      fetchReviews();
      fetchReviewStats();
    }
  }, [user?._id]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first!');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isLoggedIn');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        skills: data.user.skills ? data.user.skills.join(', ') : '',
        bio: data.user.bio || '',
        location: {
          city: data.user.location?.city || '',
          state: data.user.location?.state || '',
          country: data.user.location?.country || ''
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const updateData = {
        name: formData.name,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        bio: formData.bio,
        location: formData.location
      };

      const response = await fetch('http://localhost:3000/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      
      // Update localStorage user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Trigger header update
      window.dispatchEvent(new Event('loginStateChange'));
      
      setEditing(false);
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: user.name || '',
      email: user.email || '',
      skills: user.skills ? user.skills.join(', ') : '',
      bio: user.bio || '',
      location: {
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || ''
      }
    });
    setErrors({});
    setEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Profile not found</h4>
          <p>Unable to load your profile. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:3000/reviews/user/${user._id}?limit=3`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await fetch(`http://localhost:3000/reviews/stats/${user._id}`);
      if (response.ok) {
        const data = await response.json();
        setReviewStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "800px" }}>
      <div className="row">
        <div className="col-md-4 mb-4">
          {/* Profile Card */}
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="mb-3">
                <img
                  src="/profile.png"
                  alt="Profile"
                  className="rounded-circle"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              </div>
              <h4 className="card-title">{user.name}</h4>
              <p className="text-muted">{user.email}</p>
              
              {user.rating && (
                <div className="mb-2">
                  <span className="text-warning">
                    {'★'.repeat(Math.floor(user.rating.average))}
                    {'☆'.repeat(5 - Math.floor(user.rating.average))}
                  </span>
                  <small className="text-muted ms-2">
                    ({user.rating.count} reviews)
                  </small>
                </div>
              )}
              
              <div className="mb-3">
                <small className="text-muted">
                  Member since {formatDate(user.createdAt)}
                </small>
              </div>
              
              {!editing && (
                <button 
                  className="btn btn-primary w-100"
                  onClick={() => setEditing(true)}
                >
                  <i className="bi bi-pencil me-2"></i>Edit Profile
                </button>
                
              )}
              <button 
                  className="btn btn-outline-secondary w-100 mt-2"
                  onClick={() => navigate("/enable-2fa")}
                >
                  Manage Two-Factor Authentication (2FA)
                </button>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {/* Profile Details */}
          <div className="card shadow">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Profile Details</h5>
              {editing && (
                <div>
                  <button 
                    className="btn btn-outline-secondary btn-sm me-2"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="card-body">
              {editing ? (
                // Edit Mode
                <form>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                        title="Email cannot be changed"
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="skills" className="form-label">Skills</label>
                    <input
                      type="text"
                      className="form-control"
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="e.g., Web Development, Graphic Design, Writing (comma separated)"
                    />
                    <div className="form-text">Enter your skills separated by commas</div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">Bio</label>
                    <textarea
                      className="form-control"
                      id="bio"
                      name="bio"
                      rows="4"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                    />
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
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
                    <div className="col-md-4">
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
                    <div className="col-md-4">
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
                </form>
              ) : (
                // View Mode
                <div>
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6 className="text-muted">Full Name</h6>
                      <p className="fw-bold">{user.name}</p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-muted">Email Address</h6>
                      <p className="fw-bold">{user.email}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="text-muted">Skills</h6>
                    {user.skills && user.skills.length > 0 ? (
                      <div>
                        {user.skills.map((skill, index) => (
                          <span key={index} className="badge bg-primary me-2 mb-2">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted fst-italic">No skills added yet</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <h6 className="text-muted">Bio</h6>
                    <p>{user.bio || <span className="text-muted fst-italic">No bio added yet</span>}</p>
                  </div>

                  <div className="mb-4">
                    <h6 className="text-muted">Location</h6>
                    {user.location && (user.location.city || user.location.state || user.location.country) ? (
                      <p>
                        <i className="bi bi-geo-alt me-2"></i>
                        {[user.location.city, user.location.state, user.location.country]
                          .filter(Boolean)
                          .join(', ')
                        }
                      </p>
                    ) : (
                      <p className="text-muted fst-italic">No location added yet</p>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-muted">Account Status</h6>
                      <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-muted">Member Since</h6>
                      <p>{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="card shadow mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-star me-2"></i>
                Reviews & Ratings
              </h5>
              {reviews.length > 3 && (
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowAllReviews(true)}
                >
                  View All Reviews
                </button>
              )}
            </div>
            
            <div className="card-body">
              {reviewStats ? (
                <>
                  {/* Rating Summary */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="text-center">
                        <div className="display-5 fw-bold text-primary mb-2">
                          {reviewStats.averageRating.toFixed(1)}
                        </div>
                        <StarRating 
                          rating={reviewStats.averageRating} 
                          readonly 
                          size="large"
                          showCount
                          reviewCount={reviewStats.totalReviews}
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <h6 className="mb-3">Rating Breakdown</h6>
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviewStats.ratingDistribution[rating] || 0;
                        const percentage = reviewStats.totalReviews > 0 ? 
                          (count / reviewStats.totalReviews) * 100 : 0;
                        
                        return (
                          <div key={rating} className="d-flex align-items-center mb-1">
                            <span className="me-2">{rating}</span>
                            <i className="bi bi-star-fill text-warning me-2"></i>
                            <div className="flex-grow-1 me-2">
                              <div className="progress" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar bg-warning" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <small className="text-muted">{count}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Reviews */}
                  {reviews.length > 0 ? (
                    <div>
                      <h6 className="mb-3">Recent Reviews</h6>
                      {reviews.map((review) => (
                        <ReviewDisplay
                          key={review._id}
                          review={review}
                          showListingInfo={true}
                          showResponseOption={true}
                          currentUserId={user._id}
                        />
                      ))}
                      
                      {reviews.length >= 3 && reviewStats.totalReviews > 3 && (
                        <div className="text-center mt-3">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => navigate(`/reviews/${user._id}`)}
                          >
                            View All {reviewStats.totalReviews} Reviews
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-star display-4 text-muted"></i>
                      <h6 className="mt-3">No Reviews Yet</h6>
                      <p className="text-muted">
                        Complete some skill exchanges to start receiving reviews!
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading reviews...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="card shadow mt-4">
            <div className="card-header">
              <h5 className="mb-0">Quick Stats</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4">
                  <h4 className="text-primary">0</h4>
                  <small className="text-muted">Active Listings</small>
                </div>
                <div className="col-4">
                  <h4 className="text-success">0</h4>
                  <small className="text-muted">Completed Projects</small>
                </div>
                <div className="col-4">
                  <h4 className="text-warning">
                    {user.rating?.average ? user.rating.average.toFixed(1) : '0.0'}
                  </h4>
                  <small className="text-muted">Average Rating</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;