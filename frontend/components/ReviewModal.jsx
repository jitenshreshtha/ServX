// components/ReviewModal.jsx
import React, { useState } from 'react';
import StarRating from './StarRating';

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  reviewee, 
  listing, 
  onReviewSubmitted 
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }
    
    if (!formData.comment.trim()) {
      newErrors.comment = 'Review comment is required';
    } else if (formData.comment.length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    } else if (formData.comment.length > 1000) {
      newErrors.comment = 'Review must be 1000 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          revieweeId: reviewee.id,
          listingId: listing.id,
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      alert('Review submitted successfully!');
      
      // Reset form
      setFormData({ rating: 0, title: '', comment: '' });
      setErrors({});
      
      // Call callback if provided
      if (onReviewSubmitted) {
        onReviewSubmitted(data.review);
      }
      
      onClose();

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ rating: 0, title: '', comment: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-star me-2"></i>
              Write a Review
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {/* Review Target Info */}
            <div className="card bg-light mb-4">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <img
                    src="/profile.png"
                    alt="Profile"
                    className="rounded-circle me-3"
                    style={{ width: '50px', height: '50px' }}
                  />
                  <div>
                    <h6 className="mb-1">Reviewing: {reviewee?.name}</h6>
                    <small className="text-muted">
                      For listing: "{listing?.title}"
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Rating */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  Overall Rating *
                </label>
                <div className="mt-2">
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={handleRatingChange}
                    size="large"
                  />
                </div>
                {errors.rating && (
                  <div className="text-danger mt-1">
                    <small>{errors.rating}</small>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="mb-3">
                <label htmlFor="reviewTitle" className="form-label fw-bold">
                  Review Title *
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  id="reviewTitle"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief summary of your experience"
                  maxLength="100"
                />
                <div className="d-flex justify-content-between mt-1">
                  {errors.title ? (
                    <div className="text-danger">
                      <small>{errors.title}</small>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <small className="text-muted">
                    {formData.title.length}/100
                  </small>
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label htmlFor="reviewComment" className="form-label fw-bold">
                  Your Review *
                </label>
                <textarea
                  className={`form-control ${errors.comment ? 'is-invalid' : ''}`}
                  id="reviewComment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Share details about your experience working with this person..."
                  maxLength="1000"
                />
                <div className="d-flex justify-content-between mt-1">
                  {errors.comment ? (
                    <div className="text-danger">
                      <small>{errors.comment}</small>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <small className="text-muted">
                    {formData.comment.length}/1000
                  </small>
                </div>
              </div>

              {/* Guidelines */}
              <div className="alert alert-info">
                <h6>Review Guidelines:</h6>
                <ul className="mb-0">
                  <li>Be honest and constructive</li>
                  <li>Focus on the work quality and communication</li>
                  <li>Avoid personal attacks or inappropriate language</li>
                  <li>Your review will be public and help other users</li>
                </ul>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || formData.rating === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-check me-2"></i>
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;