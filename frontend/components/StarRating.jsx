// components/StarRating.jsx
import React, { useState } from 'react';

const StarRating = ({ 
  rating = 0, 
  onRatingChange = null, 
  readonly = false, 
  size = 'medium',
  showCount = false,
  reviewCount = 0 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  const sizes = {
    small: 'fs-6',
    medium: 'fs-5', 
    large: 'fs-4'
  };

  const handleStarClick = (starRating) => {
    if (readonly) return;
    
    setSelectedRating(starRating);
    if (onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating) => {
    if (readonly) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const getStarClass = (starNumber) => {
    const currentRating = readonly ? rating : (hoverRating || selectedRating);
    
    if (currentRating >= starNumber) {
      return 'bi-star-fill text-warning';
    } else if (currentRating >= starNumber - 0.5) {
      return 'bi-star-half text-warning';
    } else {
      return readonly ? 'bi-star text-muted' : 'bi-star text-secondary';
    }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  return (
    <div className="d-flex align-items-center">
      <div 
        className={`d-flex ${sizes[size]} ${!readonly ? 'user-select-none' : ''}`}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: readonly ? 'default' : 'pointer' }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi ${getStarClass(star)} me-1`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            style={{ 
              cursor: readonly ? 'default' : 'pointer',
              transition: 'color 0.2s ease'
            }}
            title={readonly ? '' : ratingLabels[star]}
          />
        ))}
      </div>
      
      {readonly && (
        <div className="ms-2">
          <span className="fw-bold">{rating.toFixed(1)}</span>
          {showCount && reviewCount > 0 && (
            <span className="text-muted ms-1">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
          )}
        </div>
      )}
      
      {!readonly && (hoverRating || selectedRating) > 0 && (
        <span className="ms-2 text-muted">
          {ratingLabels[hoverRating || selectedRating]}
        </span>
      )}
    </div>
  );
};

export default StarRating;