import React, { useState, useEffect, useContext } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Chat from "../components/Chat";
import { useAuth } from '../src/context/Authcontext';

function Homepage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
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

  useEffect(() => {
    fetchListings();
    checkLoginStatus();
    
    // Listen for login state changes
    const handleLoginStateChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('loginStateChange', handleLoginStateChange);
    
    return () => {
      window.removeEventListener('loginStateChange', handleLoginStateChange);
    };
  }, [filters]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
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
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      search: "",
      skillOffered: "",
      skillWanted: "",
    });
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
const handleContactClick = (listing) => {
  // Check if we have a valid user object with id
  if (!currentUser || !currentUser.id) {
    alert("Please login to start a chat");
    return;
  }

  if (currentUser.id === listing.author._id) {
    alert("You can't contact yourself!");
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

  return (
    <div>
      <Header />

      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">Welcome to ServX</h1>
          <p className="lead mb-4">
            Exchange skills, share knowledge, and build your community
          </p>
          <Link to="/create-listing" className="btn btn-light btn-lg">
            <i className="bi bi-plus-circle me-2"></i>Create Your First Listing
          </Link>
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
            {(filters.category ||
              filters.search ||
              filters.skillOffered ||
              filters.skillWanted) && (
              <div className="mt-3">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={clearFilters}
                >
                  <i className="bi bi-x-circle me-1"></i>Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="container mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Recent Listings</h3>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted">{listings.length} listings found</span>
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
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-search display-1 text-muted"></i>
            <h4 className="mt-3">No listings found</h4>
            <p className="text-muted">
              Try adjusting your search criteria or create a new listing
            </p>
            <Link to="/create-listing" className="btn btn-primary">
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="row">
            {listings.map((listing) => (
              <div className="col-lg-6 mb-4" key={listing._id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{listing.title}</h5>
                      <span
                        className={`badge ${
                          listing.status === "active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>

                    <p className="card-text text-muted">
                      {listing.description.length > 150
                        ? listing.description.substring(0, 150) + "..."
                        : listing.description}
                    </p>

                    <div className="row mb-3">
                      <div className="col-6">
                        <small className="text-muted">Offering:</small>
                        <div className="fw-bold text-success">
                          {listing.skillOffered}
                        </div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Seeking:</small>
                        <div className="fw-bold text-primary">
                          {listing.skillWanted}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-light text-dark">
                        {listing.category}
                      </span>
                      {listing.estimatedDuration && (
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {listing.estimatedDuration}
                        </small>
                      )}
                    </div>

                    {listing.tags && listing.tags.length > 0 && (
                      <div className="mb-2">
                        {listing.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="badge bg-secondary me-1 mb-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted">
                          By {listing.author?.name || "Anonymous"}
                        </small>
                        <br />
                        <small className="text-muted">
                          {formatDate(listing.createdAt)}
                        </small>
                      </div>
                      <div>
                        {listing.location?.isRemote && (
                          <span className="badge bg-info me-2">Remote</span>
                        )}
                        {listing.location?.city && (
                          <small className="text-muted">
                            <i className="bi bi-geo-alt me-1"></i>
                            {listing.location.city}
                            {listing.location.state &&
                              `, ${listing.location.state}`}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card-footer bg-transparent">
                    <button
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => handleContactClick(listing)}
                    >
                      <i className="bi bi-chat-dots me-2"></i>Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
