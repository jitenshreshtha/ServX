import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RequestsPage = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'received') {
      fetchReceivedRequests();
    } else {
      fetchSentRequests();
    }
  }, [activeTab, filter]);

  const fetchReceivedRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/requests/received?status=${filter}&limit=20`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        setReceivedRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching received requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/requests/sent?status=${filter}&limit=20`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        setSentRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, action, responseMessage = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/requests/${requestId}/respond`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action, responseMessage })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert(`Request ${action}ed successfully!`);
        
        if (action === 'accept' && data.conversation) {
          // Navigate to chat
          navigate('/inbox');
        }
        
        fetchReceivedRequests(); // Refresh the list
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert('Request cancelled successfully');
        fetchSentRequests();
      }
    } catch (error) {
      alert('Error cancelling request');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'bg-warning', text: 'Pending' },
      accepted: { class: 'bg-success', text: 'Accepted' },
      declined: { class: 'bg-danger', text: 'Declined' },
      cancelled: { class: 'bg-secondary', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const requests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Connection Requests</h2>
        <button 
          className="btn btn-outline-primary"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Listings
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            <i className="bi bi-inbox me-2"></i>
            Received ({receivedRequests.filter(r => r.status === 'pending').length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            <i className="bi bi-send me-2"></i>
            Sent
          </button>
        </li>
      </ul>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            {activeTab === 'sent' && <option value="cancelled">Cancelled</option>}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted"></i>
          <h4 className="mt-3">No {filter !== 'all' ? filter : ''} requests found</h4>
          <p className="text-muted">
            {activeTab === 'received' 
              ? "You haven't received any connection requests yet."
              : "You haven't sent any connection requests yet."
            }
          </p>
        </div>
      ) : (
        <div className="row">
          {requests.map((request) => (
            <div key={request._id} className="col-md-6 mb-4">
              <div className="card h-100">
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
                        <h6 className="mb-1">
                          {activeTab === 'received' 
                            ? request.sender?.name 
                            : request.recipient?.name
                          }
                        </h6>
                        <small className="text-muted">
                          {formatDate(request.createdAt)}
                        </small>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {/* Listing Info */}
                  <div className="mb-3">
                    <h6 className="text-primary">{request.listing?.title}</h6>
                    <small className="text-muted">
                      {request.listing?.skillOffered} ↔ {request.listing?.skillWanted}
                    </small>
                  </div>

                  {/* Request Message */}
                  <div className="mb-3">
                    <p className="card-text">{request.message}</p>
                  </div>

                  {/* Response Message */}
                  {request.responseMessage && (
                    <div className="alert alert-info">
                      <strong>Response:</strong> {request.responseMessage}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-auto">
                    {activeTab === 'received' && request.status === 'pending' && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm flex-fill"
                          onClick={() => handleRequestResponse(request._id, 'accept')}
                        >
                          <i className="bi bi-check me-1"></i>
                          Accept
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm flex-fill"
                          onClick={() => handleRequestResponse(request._id, 'decline')}
                        >
                          <i className="bi bi-x me-1"></i>
                          Decline
                        </button>
                      </div>
                    )}

                    {activeTab === 'sent' && request.status === 'pending' && (
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleCancelRequest(request._id)}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Cancel Request
                      </button>
                    )}

                    {request.status === 'accepted' && (
                      <button
                        className="btn btn-primary btn-sm w-100"
                        onClick={() => navigate('/inbox')}
                      >
                        <i className="bi bi-chat-dots me-1"></i>
                        Go to Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestsPage;