// components/ReviewDisplay.jsx
import React from 'react';
import StarRating from './StarRating';

const ReviewDisplay = ({ 
  review, 
  showListingInfo = false, 
  showResponseOption = false,
  onResponseClick = null,
  currentUserId = null 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canRespond = showResponseOption && 
                     currentUserId === review.reviewee?._id && 
                     !review.response?.comment;

  return (
    <div className="card mb-3">
      <div className="card-body">
        {/* Review Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center">
            <img
              src="/profile.png"
              alt="Reviewer"
              className="rounded-circle me-3"
              style={{ width: '40px', height: '40px' }}
            />
            <div>
              <h6 className="mb-1">{review.reviewer?.name || 'Anonymous'}</h6>
              <small className="text-muted">
                {formatDate(review.createdAt)}
              </small>
            </div>
          </div>
          <StarRating rating={review.rating} readonly size="small" />
        </div>

        {/* Listing Info (if requested) */}
        {showListingInfo && review.listing && (
          <div className="mb-3">
            <small className="text-muted">
              <i className="bi bi-tag me-1"></i>
              For listing: <strong>{review.listing.title}</strong>
            </small>
          </div>
        )}

        {/* Review Content */}
        <div className="mb-3">
          <h6 className="fw-bold mb-2">{review.title}</h6>
          <p className="mb-0 text-break">{review.comment}</p>
        </div>

        {/* Review Response */}
        {review.response?.comment && (
          <div className="bg-light p-3 rounded mt-3">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-reply me-2 text-primary"></i>
              <strong>Response from {review.reviewee?.name}</strong>
              <small className="text-muted ms-2">
                {formatDate(review.response.respondedAt)}
              </small>
            </div>
            <p className="mb-0 text-break">{review.response.comment}</p>
          </div>
        )}

        {/* Response Option */}
        {canRespond && (
          <div className="mt-3 pt-3 border-top">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => onResponseClick && onResponseClick(review)}
            >
              <i className="bi bi-reply me-2"></i>
              Respond to this review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDisplay;