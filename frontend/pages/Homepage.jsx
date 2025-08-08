import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import RequestModal from "../components/RequestModal";
import StarRating from "../components/StarRating";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../src/context/Authcontext";
import "bootstrap/dist/css/bootstrap.min.css";

function Homepage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  const [itemsPerPage] = useState(6);
  const [pagination, setPagination] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [filters, setFilters] = useState({
    skillWanted: "",
    locationQuery: "",
    category: "",
    search: "",
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, [currentPage, filters]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
  };

  useEffect(() => {
    checkLoginStatus();
    const handleLoginStateChange = () => checkLoginStatus();
    window.addEventListener("loginStateChange", handleLoginStateChange);
    return () =>
      window.removeEventListener("loginStateChange", handleLoginStateChange);
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage);
      queryParams.append("limit", itemsPerPage);
      if (filters.skillWanted)
        queryParams.append("skillWanted", filters.skillWanted);
      if (filters.locationQuery)
        queryParams.append("location", filters.locationQuery);
      if (filters.category && filters.category !== "all")
        queryParams.append("category", filters.category);
      if (filters.search) queryParams.append("search", filters.search);

      const response = await fetch(
        `http://localhost:3000/listings?${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        setListings(data.listings || []);
        setPagination(data.pagination);
        setTotalPages(data.pagination?.pages || 1);
        setTotalListings(data.pagination?.total || 0);
      } else {
        setListings([]);
        setTotalPages(1);
        setTotalListings(0);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
      setTotalPages(1);
      setTotalListings(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchListings();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      skillWanted: "",
      locationQuery: "",
      category: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const handleContactClick = async (listing) => {
    if (!listing || !listing.author || !listing.author._id || !listing._id) {
      alert("Cannot contact: missing author or listing info");
      return;
    }

    // Check if request can be sent
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/requests/can-send/${listing.author._id}/${listing._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!data.canSend) {
        if (data.reason === "Conversation already exists") {
          navigate("/inbox");
        } else {
          alert(data.reason);
        }
        return;
      }

      // Open request modal
      setSelectedListing(listing);
      setShowRequestModal(true);
    } catch (error) {
      console.error("Error checking request status:", error);
      alert("Unable to check request status. Please try again.");
    }
  };

  const handleHireClick = async (service) => {
    if (!loggedIn) {
      alert("Please login to proceed with hiring.");
      return navigate("/login");
    }

    try {
      const token = localStorage.getItem("token");
      console.log("🟡 Hiring service:", service);
      console.log("🟡 Sending request with serviceId:", service._id);

      const response = await fetch(
        "http://localhost:3000/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ serviceId: service._id }),
        }
      );

      console.log("🟡 Raw response:", response);

      const data = await response.json();
      console.log("🟢 Stripe session response:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to start payment session.");
      }
    } catch (err) {
      console.error("🔴 Payment error:", err);
      alert("Something went wrong. Try again later.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          <button
            className="btn btn-light btn-lg"
            onClick={() => {
              if (!loggedIn) navigate("/login");
              else navigate("/create-listing");
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            {loggedIn ? "Create Your Listing" : "Login to Create Listing"}
          </button>
          {!loggedIn && (
            <div className="mt-3">
              <small className="text-light">
                <Link
                  to="/signup"
                  className="text-light text-decoration-underline"
                >
                  New user? Sign up here
                </Link>
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="container mt-4 mb-3">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">Find Skills</h5>

            {/* Search Row */}
            <div className="row g-2 mb-3">
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search listings..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Skill Wanted"
                  value={filters.skillWanted}
                  onChange={(e) =>
                    setFilters({ ...filters, skillWanted: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Location"
                  value={filters.locationQuery}
                  onChange={(e) =>
                    setFilters({ ...filters, locationQuery: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleSearch}>
                <i className="bi bi-search me-2"></i>Search
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                <i className="bi bi-x-circle me-2"></i>Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3>Listings</h3>
            {pagination && (
              <p className="text-muted mb-0">
                Showing {pagination.showing.start}-{pagination.showing.end} of{" "}
                {pagination.total} listings
              </p>
            )}
          </div>

          {totalListings > 0 && (
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
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
              {Object.values(filters).some((filter) => filter)
                ? "Try adjusting your search criteria or clear filters to see all listings."
                : "Be the first to create a listing!"}
            </p>
            {!Object.values(filters).some((filter) => filter) && loggedIn && (
              <button
                className="btn btn-primary mt-3"
                onClick={() => navigate("/create-listing")}
              >
                <i className="bi bi-plus-circle me-2"></i>Create First Listing
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="row">
              {listings.map((listing) => (
                <div className="col-lg-6 mb-4" key={listing._id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">{listing.title}</h5>
                        <span
                          className={`badge ${
                            listing.isService ? "bg-success" : "bg-primary"
                          }`}
                        >
                          {listing.isService ? "Service" : listing.category}
                        </span>
                      </div>

                      <p className="text-muted mb-3">
                        {listing.description?.slice(0, 120)}
                        {listing.description?.length > 120 ? "..." : ""}
                      </p>

                      <div className="row mb-3">
                        <div className="col-6">
                          <small className="text-muted">Offering:</small>
                          <div className="fw-bold text-success">
                            {listing.skillOffered}
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">
                            {listing.isService ? "Pay Range:" : "Seeking:"}
                          </small>
                          <div className="fw-bold text-primary">
                            {listing.isService
                              ? `$${listing.salaryMin} - $${listing.salaryMax}`
                              : listing.skillWanted}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          <img
                            src="/profile.png"
                            alt="Profile"
                            className="rounded-circle me-2"
                            style={{ width: "24px", height: "24px" }}
                          />
                          <div>
                            <small className="text-muted">
                              By {listing.author?.name}
                            </small>
                            {listing.author?.rating?.count > 0 && (
                              <div className="mt-1">
                                <StarRating
                                  rating={listing.author.rating.average}
                                  readonly
                                  size="small"
                                  showCount
                                  reviewCount={listing.author.rating.count}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <small className="text-muted">
                          <i className="bi bi-calendar me-1"></i>
                          {formatDate(listing.createdAt)}
                        </small>
                      </div>

                      {listing.location && (
                        <div className="mb-2">
                          <small className="text-muted">
                            <i className="bi bi-geo-alt me-1"></i>
                            {[
                              listing.location.city,
                              listing.location.state,
                              listing.location.country,
                            ]
                              .filter(Boolean)
                              .join(", ") || "Location not specified"}
                          </small>
                        </div>
                      )}

                      {listing.tags && listing.tags.length > 0 && (
                        <div className="mb-3">
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
                    </div>

                    <div className="d-flex align-items-center mb-3">
                      {listing.author?.rating?.average >= 4.5 &&
                        listing.author?.rating?.count >= 5 && (
                          <span className="badge bg-success me-2">
                            <i className="bi bi-shield-check me-1"></i>
                            Highly Rated
                          </span>
                        )}
                      {listing.author?.rating?.count >= 10 && (
                        <span className="badge bg-info me-2">
                          <i className="bi bi-award me-1"></i>
                          Experienced
                        </span>
                      )}
                      {listing.createdAt &&
                        new Date() - new Date(listing.createdAt) <
                          7 * 24 * 60 * 60 * 1000 && (
                          <span className="badge bg-warning text-dark">
                            <i className="bi bi-clock me-1"></i>
                            New
                          </span>
                        )}
                    </div>

                    <div className="card-footer bg-transparent">
                      {loggedIn ? (
                        <button
                          className={`btn w-100 ${
                            listing.isService ? "btn-success" : "btn-primary"
                          }`}
                          onClick={() =>
                            listing.isService
                              ? handleHireClick(listing)
                              : handleContactClick(listing)
                          }
                        >
                          <i
                            className={`bi ${
                              listing.isService
                                ? "bi-credit-card"
                                : "bi-person-plus"
                            } me-2`}
                          ></i>
                          {listing.isService ? "Hire Now" : "Send Request"}
                        </button>
                      ) : (
                        <button
                          className={`btn w-100 ${
                            listing.isService
                              ? "btn-outline-success"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => {
                            alert(
                              `Please login to ${
                                listing.isService
                                  ? "hire this service"
                                  : "contact the author"
                              }!`
                            );
                            navigate("/login");
                          }}
                        >
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Login to {listing.isService ? "Hire" : "Contact"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />

            {showRequestModal && selectedListing && (
              <RequestModal
                isOpen={showRequestModal}
                onClose={() => {
                  setShowRequestModal(false);
                  setSelectedListing(null);
                }}
                recipient={{
                  id: selectedListing.author._id,
                  name: selectedListing.author.name,
                }}
                listing={{
                  id: selectedListing._id,
                  title: selectedListing.title,
                }}
                onRequestSent={() => {
                  setShowRequestModal(false);
                  setSelectedListing(null);
                }}
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Homepage;
