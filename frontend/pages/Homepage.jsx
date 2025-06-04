import React, { useState, useEffect, useContext } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Chat from "../components/Chat";
import { useAuth } from '../src/context/Authcontext';

function Homepage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [filters, setFilters] = useState({
    category: "",
    search: "",
    skillOffered: "",
    skillWanted: "",
  });
  const { currentUser } = useAuth();

  // Chat modal state
  const [showChat, setShowChat] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

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
    "Other",
  ];

  // Fetch listings when page, filters, or items per page changes
  useEffect(() => {
    fetchListings();
  }, [currentPage, filters, itemsPerPage]);

  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
    
    // Listen for login state changes
    const handleLoginStateChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('loginStateChange', handleLoginStateChange);
    
    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange);
    };
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      // Add pagination parameters
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());

      // Add filter parameters
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.skillOffered)
        queryParams.append("skillOffered", filters.skillOffered);
      if (filters.skillWanted)
        queryParams.append("skillWanted", filters.skillWanted);

      const response = await fetch(
        `http://localhost:3000/listings?${queryParams}`
      );
      const data = await response.json();

      setListings(data.listings || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalListings(data.pagination?.total || 0);

    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
      setTotalPages(1);
      setTotalListings(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      search: "",
      skillOffered: "",
      skillWanted: "",
    });
    setCurrentPage(1);
  };

  const handleCreateListingClick = () => {
    if (!loggedIn) {
      alert('Please login first to create a listing!');
      navigate('/login');
    } else {
      navigate('/create-listing');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Updated handleContactClick function
// Updated handleContactClick function
const handleContactClick = (listing) => {
  // Use currentUser.id instead of currentUser._id
  if (!currentUser || !currentUser.id) {
    alert("Please login to start a chat");
    return;
  }


  
  setSelectedRecipient({
    id: listing.author._id,
    name: listing.author.name,
  });

  setSelectedListing({
    id: listing._id,
    title: listing.title,
  });

  setShowChat(true);
};

// Calculate showing range
  const showingStart = totalListings === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingEnd = Math.min(currentPage * itemsPerPage, totalListings);

  return (
    <div>
      <Header />

      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">Welcome to ServX</h1>
          <p className="lead mb-4">Exchange skills, share knowledge, and build your community</p>
          
          {/* Protected Create Listing Button */}
          <button 
            className="btn btn-light btn-lg"
            onClick={handleCreateListingClick}
          >
            <i className="bi bi-plus-circle me-2"></i>
            {loggedIn ? 'Create Your Listing' : 'Login to Create Listing'}
          </button>
          
          {!loggedIn && (
            <div className="mt-3">
              <small className="text-light">
                <Link to="/signup" className="text-light text-decoration-underline">
                  New user? Sign up here
                </Link>
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container my-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Find Skills & Services</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <select
                  className="form-select"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Skill offered..."
                  name="skillOffered"
                  value={filters.skillOffered}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Skill wanted..."
                  name="skillWanted"
                  value={filters.skillWanted}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search listings..."
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            {/* Filter Actions and Items Per Page */}
            <div className="row mt-3">
              <div className="col-md-6">
                {(filters.category || filters.search || filters.skillOffered || filters.skillWanted) && (
                  <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                    <i className="bi bi-x-circle me-1"></i>Clear Filters
                  </button>
                )}
              </div>
              <div className="col-md-6 text-end">
                <label className="form-label me-2 mb-0" style={{ lineHeight: '2.5' }}>
                  Show:
                </label>
                <select 
                  className="form-select d-inline-block w-auto"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  disabled={loading}
                >
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="container mb-5">
        {/* Header with Results Info */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3>Skill Exchange Listings</h3>
            {totalListings > 0 && (
              <p className="text-muted mb-0">
                Showing {showingStart}-{showingEnd} of {totalListings} listings
              </p>
            )}
          </div>
          <div className="d-flex align-items-center gap-3">
            {loggedIn && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/create-listing')}
              >
                <i className="bi bi-plus me-1"></i>New Listing
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-search display-1 text-muted"></i>
            <h4 className="mt-3">No listings found</h4>
            <p className="text-muted">
              {(filters.category || filters.search || filters.skillOffered || filters.skillWanted) 
                ? "Try adjusting your search criteria or create a new listing" 
                : (loggedIn 
                  ? "Be the first to create a listing in our community!" 
                  : "No listings available yet. Login to create the first one!"
                )
              }
            </p>
            <div className="mt-3">
              {(filters.category || filters.search || filters.skillOffered || filters.skillWanted) && (
                <button className="btn btn-outline-primary me-2" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
              <button 
                className="btn btn-primary"
                onClick={handleCreateListingClick}
              >
                {loggedIn ? 'Create Listing' : 'Login to Create Listing'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Listings Grid */}
            <div className="row">
              {listings.map((listing) => (
                <div className="col-lg-6 mb-4" key={listing._id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">{listing.title}</h5>
                        <span className={`badge ${listing.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {listing.status}
                        </span>
                      </div>
                      
                      <p className="card-text text-muted">
                        {listing.description.length > 150 
                          ? listing.description.substring(0, 150) + '...' 
                          : listing.description}
                      </p>
                      
                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Offering:</small>
                          <div className="fw-bold text-success">{listing.skillOffered}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Seeking:</small>
                          <div className="fw-bold text-primary">{listing.skillWanted}</div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-light text-dark">{listing.category}</span>
                        {listing.estimatedDuration && (
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>{listing.estimatedDuration}
                          </small>
                        )}
                      </div>

                      {listing.tags && listing.tags.length > 0 && (
                        <div className="mb-2">
                          {listing.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="badge bg-secondary me-1 mb-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">By {listing.author?.name || 'Anonymous'}</small>
                          <br />
                          <small className="text-muted">{formatDate(listing.createdAt)}</small>
                        </div>
                        <div>
                          {listing.location?.isRemote && (
                            <span className="badge bg-info me-2">Remote</span>
                          )}
                          {listing.location?.city && (
                            <small className="text-muted">
                              <i className="bi bi-geo-alt me-1"></i>
                              {listing.location.city}
                              {listing.location.state && `, ${listing.location.state}`}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-footer bg-transparent">
                      {loggedIn ? (
                        <button className="btn btn-primary btn-sm w-100">
                          <i className="bi bi-chat-dots me-2"></i>Contact
                        </button>
                      ) : (
                        <button 
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={() => {
                            alert('Please login to contact the author!');
                            navigate('/login');
                          }}
                        >
                          <i className="bi bi-box-arrow-in-right me-2"></i>Login to Contact
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && currentUser && selectedRecipient && selectedListing && (
        <Chat
          currentUser={currentUser}
          recipient={selectedRecipient}
          listing={selectedListing}
          onClose={() => setShowChat(false)}
        />
      )}

      <Footer />
    </div>
  );
}

export default Homepage;
