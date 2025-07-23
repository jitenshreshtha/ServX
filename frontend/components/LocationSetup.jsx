import React, { useState } from 'react';

const LocationSetup = ({ onLocationSet, currentLocation }) => {
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [isPublic, setIsPublic] = useState(currentLocation?.isLocationPublic || false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Geocode the address
      const geoResponse = await fetch('http://localhost:3000/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ address })
      });

      const geoData = await geoResponse.json();

      if (geoData.success) {
        // Update user location
        const updateResponse = await fetch('http://localhost:3000/profile/location', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            address: geoData.formattedAddress,
            coordinates: geoData.coordinates,
            isLocationPublic: isPublic
          })
        });

        const updateData = await updateResponse.json();

        if (updateData.success) {
          alert('Location updated successfully!');
          if (onLocationSet) onLocationSet(updateData.user);
        }
      }
    } catch (error) {
      alert('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">
          <i className="bi bi-geo-alt me-2"></i>
          Location Settings
        </h5>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address (e.g., Kitchener, ON, Canada)"
              required
            />
            <div className="form-text">
              This helps us show you relevant local opportunities
            </div>
          </div>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="locationPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="locationPublic">
              Make my general location visible to other users
            </label>
            <div className="form-text">
              Only your city/region will be shown, not your exact address
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Location'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocationSetup;