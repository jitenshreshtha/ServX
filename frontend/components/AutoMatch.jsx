// components/AutoMatch.jsx
import React, { useState, useEffect } from 'react';

const AutoMatch = ({ listing, onClose }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    if (listing?._id) {
      findMatches();
    }
  }, [listing]);

  const findMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/matches/find/${listing._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setMatches(data.matches);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      alert('Failed to find matches: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMatchRequest = async (matchedListing) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/matches/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchedListingId: matchedListing._id,
          originalListingId: listing._id,
          message: `Hi ${matchedListing.author.name}! I found your listing through auto-match. ${matchedListing.matchReason} Would you like to collaborate?`
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Match request sent successfully!');
        setSentRequests(prev => new Set([...prev, matchedListing._id]));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending match request:', error);
      alert('Failed to send request: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const getMatchBadge = (matchType, matchScore) => {
    const configs = {
      perfect: { class: 'bg-success', text: `Perfect Match (${matchScore}%)`, icon: 'bi-heart-fill' },
      good: { class: 'bg-primary', text: `Good Match (${matchScore}%)`, icon: 'bi-star-fill' },
      potential: { class: 'bg-warning', text: `Potential (${matchScore}%)`, icon: 'bi-star-half' },
      weak: { class: 'bg-secondary', text: `Similar (${matchScore}%)`, icon: 'bi-star' }
    };
    
    const config = configs[matchType] || configs.weak;
    return (
      <span className={`badge ${config.class} d-flex align-items-center`}>
        <i className={`bi ${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-lightning-charge me-2 text-warning"></i>
              Auto-Match Results
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <div className="alert alert-info">
              <strong>Looking for:</strong> {listing.skillWanted} for "{listing.title}"
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Finding matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-search display-4 text-muted"></i>
                <h5 className="mt-3">No Matches Found</h5>
                <p className="text-muted">
                  We couldn't find any users offering "{listing.skillWanted}" right now.
                  Try again later or create a more general listing.
                </p>
              </div>
            ) : (
              <div>
                <h6 className="mb-3">Found {matches.length} potential matches:</h6>
                
                {matches.map(match => (
                  <div key={match._id} className="card mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                          <img 
                            src="/profile.png" 
                            alt="Profile"
                            className="rounded-circle me-3"
                            style={{ width: '40px', height: '40px' }}
                          />
                          <div>
                            <h6 className="mb-1">{match.author.name}</h6>
                            {match.author.rating?.count > 0 && (
                              <div className="d-flex align-items-center">
                                <span className="text-warning">
                                  {'★'.repeat(Math.floor(match.author.rating.average))}
                                </span>
                                <small className="text-muted ms-1">
                                  ({match.author.rating.count} reviews)
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                        {getMatchBadge(match.matchType, match.matchScore)}
                      </div>

                      <h6 className="text-primary">{match.title}</h6>
                      <p className="text-muted mb-2">{match.description?.slice(0, 100)}...</p>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">They offer:</small>
                          <div className="fw-bold text-success">{match.skillOffered}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">They want:</small>
                          <div className="fw-bold text-primary">{match.skillWanted}</div>
                        </div>
                      </div>

                      <div className="alert alert-light mb-3">
                        <small><strong>Why this is a match:</strong> {match.matchReason}</small>
                      </div>

                      <div className="text-end">
                        {sentRequests.has(match._id) ? (
                          <button className="btn btn-success" disabled>
                            <i className="bi bi-check-circle me-1"></i>
                            Request Sent!
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => sendMatchRequest(match)}
                            disabled={sending}
                          >
                            {sending ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Sending...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-lightning me-1"></i>
                                Send Match Request
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
            {matches.length > 0 && (
              <button 
                className="btn btn-outline-primary"
                onClick={findMatches}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh Matches
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoMatch;