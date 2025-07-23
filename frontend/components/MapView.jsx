import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const isInitializedRef = useRef(false);

    const [listings, setListings] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState([43.4643, -80.5204]); // Kitchener, ON
    const [radius, setRadius] = useState(50);
    const [loading, setLoading] = useState(false);

    // Initialize map only once
    useEffect(() => {
        if (mapRef.current && !isInitializedRef.current) {
            console.log('🗺️ Initializing map...');

            // Create map instance
            mapInstanceRef.current = L.map(mapRef.current, {
                center: mapCenter,
                zoom: 11,
                zoomControl: true
            });

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(mapInstanceRef.current);

            isInitializedRef.current = true;
            console.log('✅ Map initialized successfully');
        }

        // Cleanup function
        return () => {
            if (mapInstanceRef.current && isInitializedRef.current) {
                console.log('🗺️ Cleaning up map...');
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                isInitializedRef.current = false;
            }
        };
    }, []); // Empty dependency array - only run once

    // Update map center when user location changes
    useEffect(() => {
        if (mapInstanceRef.current && userLocation) {
            console.log('🗺️ Updating map center to user location:', userLocation);
            mapInstanceRef.current.setView(userLocation, 12);
        }
    }, [userLocation]);

    // Custom marker icons
    const createCustomIcon = (color, isUser = false) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `
        <div style="
          background-color: ${color};
          width: ${isUser ? '16' : '14'}px;
          height: ${isUser ? '16' : '14'}px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ${isUser ? 'border: 3px solid #fff; box-shadow: 0 0 0 2px ' + color + ', 0 2px 4px rgba(0,0,0,0.3);' : ''}
        "></div>
      `,
            iconSize: [isUser ? 22 : 18, isUser ? 22 : 18],
            iconAnchor: [isUser ? 11 : 9, isUser ? 11 : 9]
        });
    };

    // Clear existing markers
    const clearMarkers = () => {
        markersRef.current.forEach(marker => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker);
            }
        });
        markersRef.current = [];
    };

    // Add markers to map
    useEffect(() => {
        if (!mapInstanceRef.current || !isInitializedRef.current) return;

        console.log('🗺️ Updating markers...');
        clearMarkers();

        // Add user location marker
        if (userLocation) {
            const userMarker = L.marker(userLocation, {
                icon: createCustomIcon('#dc3545', true)
            }).addTo(mapInstanceRef.current);

            userMarker.bindPopup(`
        <div style="text-align: center;">
          <strong>Your Location</strong><br>
          <small>Search radius: ${radius} km</small>
        </div>
      `);

            markersRef.current.push(userMarker);
        }

        // Add listing markers
        listings.forEach(listing => {
            if (!listing.location?.coordinates?.coordinates) {
                // For testing, if no coordinates, use random ones near Kitchener
                const lat = 43.4643 + (Math.random() - 0.5) * 0.1;
                const lng = -80.5204 + (Math.random() - 0.5) * 0.1;

                const color = listing.isService ? '#28a745' : '#0d6efd';

                const marker = L.marker([lat, lng], {
                    icon: createCustomIcon(color)
                }).addTo(mapInstanceRef.current);

                const popupContent = `
          <div style="min-width: 250px; font-family: inherit;">
            <h6 style="margin-bottom: 8px;">${listing.title}</h6>
            <div style="margin-bottom: 8px;">
              <span style="
                background-color: ${listing.isService ? '#28a745' : '#0d6efd'};
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
              ">
                ${listing.isService ? 'Service' : 'Exchange'}
              </span>
            </div>
            <p style="font-size: 12px; margin-bottom: 8px;">
              ${listing.description?.substring(0, 100) || 'No description'}...
            </p>
            <div style="margin-bottom: 8px; font-size: 12px;">
              <strong>Offering:</strong> ${listing.skillOffered}<br>
              <strong>${listing.isService ? 'Price:' : 'Seeking:'}</strong> 
              ${listing.isService ? `$${listing.salaryMin || 0}-$${listing.salaryMax || 0}` : listing.skillWanted}
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <img src="/profile.png" alt="Profile" style="
                width: 20px; 
                height: 20px; 
                border-radius: 50%; 
                margin-right: 8px;
              ">
              <small>${listing.author?.name || 'Unknown'}</small>
            </div>
            <button onclick="handleContactClick('${listing._id}')" style="
              background-color: #0d6efd;
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 4px;
              width: 100%;
              font-size: 12px;
              cursor: pointer;
            ">
              Contact
            </button>
          </div>
        `;

                marker.bindPopup(popupContent);
                markersRef.current.push(marker);
                return;
            }

            const [lng, lat] = listing.location.coordinates.coordinates;
            const color = listing.isService ? '#28a745' : '#0d6efd';

            const marker = L.marker([lat, lng], {
                icon: createCustomIcon(color)
            }).addTo(mapInstanceRef.current);

            const popupContent = `
        <div style="min-width: 250px; font-family: inherit;">
          <h6 style="margin-bottom: 8px;">${listing.title}</h6>
          <div style="margin-bottom: 8px;">
            <span style="
              background-color: ${listing.isService ? '#28a745' : '#0d6efd'};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
            ">
              ${listing.isService ? 'Service' : 'Exchange'}
            </span>
          </div>
          <p style="font-size: 12px; margin-bottom: 8px;">
            ${listing.description?.substring(0, 100)}...
          </p>
          <div style="margin-bottom: 8px; font-size: 12px;">
            <strong>Offering:</strong> ${listing.skillOffered}<br>
            <strong>${listing.isService ? 'Price:' : 'Seeking:'}</strong> 
            ${listing.isService ? `$${listing.salaryMin}-$${listing.salaryMax}` : listing.skillWanted}
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="/profile.png" alt="Profile" style="
              width: 20px; 
              height: 20px; 
              border-radius: 50%; 
              margin-right: 8px;
            ">
            <small>${listing.author?.name}</small>
          </div>
          <button onclick="handleContactClick('${listing._id}')" style="
            background-color: #0d6efd;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            width: 100%;
            font-size: 12px;
            cursor: pointer;
          ">
            Contact
          </button>
        </div>
      `;

            marker.bindPopup(popupContent);
            markersRef.current.push(marker);
        });

        console.log(`✅ Added ${markersRef.current.length} markers to map`);
    }, [listings, userLocation, radius]);

    // Make handleContactClick available globally for popup buttons
    useEffect(() => {
        window.handleContactClick = (listingId) => {
            console.log('Contact clicked for listing:', listingId);
            // Navigate to inbox with listing info
            window.location.href = `/inbox?listing=${listingId}`;
        };

        return () => {
            delete window.handleContactClick;
        };
    }, []);

    const getCurrentLocation = () => {
        console.log('🗺️ Getting current location...');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = [position.coords.latitude, position.coords.longitude];
                    console.log('✅ Location obtained:', coords);
                    setUserLocation(coords);
                    setMapCenter(coords);
                },
                (error) => {
                    console.log("❌ Location access denied or failed:", error);
                    alert("Could not get your location. Using default location (Kitchener, ON).");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const fetchNearbyListings = async () => {
        setLoading(true);
        try {
            // Get authentication token (but don't require it)
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add authorization header if token exists (optional)
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            let url = 'http://localhost:3000/listings/nearby';

            if (userLocation) {
                const [lat, lng] = userLocation;
                url += `?lat=${lat}&lng=${lng}&radius=${radius}&limit=50`;
            } else {
                url += `?limit=20`;
            }

            console.log('🗺️ Fetching listings from:', url);
            console.log('🗺️ With headers:', headers);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            console.log('🗺️ Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📍 API Response:', data);

            if (data.success && data.listings) {
                console.log(`✅ Found ${data.listings.length} listings`);
                setListings(data.listings);
            } else {
                console.log('❌ No listings found in response');
                setListings([]);
            }

        } catch (error) {
            console.error("❌ Error fetching nearby listings:", error);

            // Fallback to regular listings endpoint
            try {
                console.log('🔄 Trying fallback listings endpoint...');
                const token = localStorage.getItem('token');
                const fallbackHeaders = {
                    'Content-Type': 'application/json'
                };

                // Don't add auth header for fallback since /listings is public
                const fallbackResponse = await fetch('http://localhost:3000/listings?limit=20', {
                    method: 'GET',
                    headers: fallbackHeaders
                });

                const fallbackData = await fallbackResponse.json();

                if (fallbackData.success && fallbackData.listings) {
                    console.log(`✅ Fallback successful: ${fallbackData.listings.length} listings`);
                    setListings(fallbackData.listings);
                } else {
                    setListings([]);
                }
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
                setListings([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useEffect(() => {
        // Delay fetching to ensure map is initialized
        const timer = setTimeout(() => {
            fetchNearbyListings();
        }, 1000);

        return () => clearTimeout(timer);
    }, [userLocation, radius]);

    return (
        <div className="container-fluid p-0">
            {/* Map Controls */}
            <div className="bg-white p-3 shadow-sm">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <h4 className="mb-0">Skill Map</h4>
                        <small className="text-muted">Discover skills and services near you</small>
                    </div>
                    <div className="col-md-6">
                        <div className="d-flex gap-3 align-items-center justify-content-end">
                            <div>
                                <label className="form-label mb-1">Search Radius:</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={radius}
                                    onChange={(e) => setRadius(parseInt(e.target.value))}
                                >
                                    <option value={10}>10 km</option>
                                    <option value={25}>25 km</option>
                                    <option value={50}>50 km</option>
                                    <option value={100}>100 km</option>
                                </select>
                            </div>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={getCurrentLocation}
                                disabled={loading}
                            >
                                <i className="bi bi-geo-alt"></i> Update Location
                            </button>
                            {loading && (
                                <div className="spinner-border spinner-border-sm text-primary"></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div
                ref={mapRef}
                style={{ height: '70vh', width: '100%' }}
                className="border"
            />

            {/* Legend */}
            <div className="bg-white p-3 border-top">
                <div className="row">
                    <div className="col-md-8">
                        <h6>Map Legend</h6>
                        <div className="d-flex gap-4">
                            <div className="d-flex align-items-center">
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#dc3545',
                                    borderRadius: '50%',
                                    marginRight: '8px',
                                    border: '2px solid #fff',
                                    boxShadow: '0 0 0 1px #dc3545'
                                }}></div>
                                <small>Your Location</small>
                            </div>
                            <div className="d-flex align-items-center">
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#0d6efd',
                                    borderRadius: '50%',
                                    marginRight: '8px'
                                }}></div>
                                <small>Skill Exchange</small>
                            </div>
                            <div className="d-flex align-items-center">
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#28a745',
                                    borderRadius: '50%',
                                    marginRight: '8px'
                                }}></div>
                                <small>Paid Service</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 text-end">
                        <small className="text-muted">
                            Found {listings.length} listings within {radius} km
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapView;