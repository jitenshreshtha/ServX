// components/UserReviews.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReviewDisplay from './ReviewDisplay';
import StarRating from './StarRating';
import Pagination from './Pagination';

const UserReviews = ({ currentUserId = null }) => {
  const { userId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchReviews();
    fetchStats();
  }, [userId, currentPage]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/reviews/user/${userId}?page=${currentPage}&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:3000/reviews/stats/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleResponseClick = (review) => {
    setSelectedReview(review);
    setShowResponseModal(true);
  };

  const handleResponseSubmit = async () => {
    if (!responseText.trim() || !selectedReview) return;

    setResponseLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/reviews/${selectedReview._id}/response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ comment: responseText })
        }
      );

      if (response.ok) {
        alert('Response submitted successfully!');
        setShowResponseModal(false);
        setResponseText('');
        setSelectedReview(null);
        fetchReviews(); // Refresh reviews
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit response');
      }
    } catch (error) {
      alert('Error submitting response: ' + error.message);
    } finally {
      setResponseLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRatingDistributionWidth = (count) => {
    if (!stats || stats.totalReviews === 0) return 0;
    return (count / stats.totalReviews) * 100;
  };

  if (loading && currentPage === 1) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h2>
            {user?.name ? `${user.name}'s Reviews` : 'User Reviews'}
          </h2>
          <p className="text-muted">
            Reviews and ratings from other users
          </p>
        </div>
      </div>

      {/* Rating Summary */}
      {stats && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-4 text-center">
                <div className="display-4 fw-bold text-primary">
                  {stats.averageRating.toFixed(1)}
                </div>
                <StarRating 
                  rating={stats.averageRating} 
                  readonly 
                  size="large"
                  showCount
                  reviewCount={stats.totalReviews}
                />
              </div>
              
              <div className="col-md-8">
                <h6 className="mb-3">Rating Distribution</h6>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="d-flex align-items-center mb-2">
                    <span className="me-2">{rating}</span>
                    <i className="bi bi-star-fill text-warning me-2"></i>
                    <div className="flex-grow-1 me-2">
                      <div className="progress" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ 
                            width: `${getRatingDistributionWidth(stats.ratingDistribution[rating])}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-muted">
                      {stats.ratingDistribution[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-star display-1 text-muted"></i>
          <h4 className="mt-3">No Reviews Yet</h4>
          <p className="text-muted">
            This user hasn't received any reviews yet.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h5>Reviews ({stats?.totalReviews || 0})</h5>
          </div>
          
          {reviews.map((review) => (
            <ReviewDisplay
              key={review._id}
              review={review}
              showListingInfo={true}
              showResponseOption={true}
              onResponseClick={handleResponseClick}
              currentUserId={currentUserId}
            />
          ))}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-reply me-2"></i>
                  Respond to Review
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowResponseModal(false)}
                  disabled={responseLoading}
                ></button>
              </div>
              
              <div className="modal-body">
                {selectedReview && (
                  <div className="mb-3">
                    <h6>Original Review:</h6>
                    <div className="bg-light p-3 rounded">
                      <div className="d-flex align-items-center mb-2">
                        <StarRating rating={selectedReview.rating} readonly size="small" />
                        <span className="ms-2 fw-bold">{selectedReview.title}</span>
                      </div>
                      <p className="mb-0">{selectedReview.comment}</p>
                    </div>
                  </div>
                )}
                
                <div className="mb-3">
                  <label htmlFor="responseText" className="form-label">
                    Your Response
                  </label>
                  <textarea
                    className="form-control"
                    id="responseText"
                    rows="4"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Thank you for your feedback..."
                    maxLength="500"
                  />
                  <div className="text-end mt-1">
                    <small className="text-muted">
                      {responseText.length}/500
                    </small>
                  </div>
                </div>

                <div className="alert alert-info">
                  <small>
                    <strong>Tips for responding:</strong> Be professional, thank them for their feedback, 
                    and address any concerns constructively.
                  </small>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowResponseModal(false)}
                  disabled={responseLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleResponseSubmit}
                  disabled={responseLoading || !responseText.trim()}
                >
                  {responseLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check me-2"></i>
                      Submit Response
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReviews;