import React, { useState } from "react";

const RequestModal = ({
  isOpen,
  onClose,
  recipient,
  listing,
  onRequestSent,
}) => {
  const [formData, setFormData] = useState({
    message: "",
    requestType: "collaboration",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      setErrors({ message: "Please include a message with your request" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: recipient.id,
          listingId: listing.id,
          message: formData.message,
          requestType: formData.requestType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message);
        if (onRequestSent) onRequestSent(data.request);
        onClose();
        setFormData({ message: "", requestType: "collaboration" });
      } else {
        throw new Error(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-plus me-2"></i>
              Send Connection Request
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {/* Recipient Info */}
            <div className="card bg-light mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <img
                    src="/profile.png"
                    alt="Profile"
                    className="rounded-circle me-3"
                    style={{ width: "50px", height: "50px" }}
                  />
                  <div>
                    <h6 className="mb-1">
                      Sending request to: {recipient?.name}
                    </h6>
                    <small className="text-muted">
                      For listing: "{listing?.title}"
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Request Type */}
              <div className="mb-3">
                <label className="form-label">Request Type</label>
                <select
                  className="form-select"
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleChange}
                >
                  <option value="collaboration">
                    Skill Exchange Collaboration
                  </option>
                  <option value="service_inquiry">Service Inquiry</option>
                  <option value="general">General Question</option>
                </select>
              </div>

              {/* Message */}
              <div className="mb-3">
                <label htmlFor="requestMessage" className="form-label">
                  Your Message *
                </label>
                <textarea
                  className={`form-control ${
                    errors.message ? "is-invalid" : ""
                  }`}
                  id="requestMessage"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Hi! I'm interested in your listing. I offer [your skill] and would like to discuss a potential collaboration..."
                  maxLength="500"
                />
                <div className="d-flex justify-content-between mt-1">
                  {errors.message ? (
                    <div className="text-danger">
                      <small>{errors.message}</small>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <small className="text-muted">
                    {formData.message.length}/500
                  </small>
                </div>
              </div>

              {/* Guidelines */}
              <div className="alert alert-info">
                <h6>Request Guidelines:</h6>
                <ul className="mb-0 small">
                  <li>Be specific about what you can offer in exchange</li>
                  <li>Explain why you're interested in their skills</li>
                  <li>Be professional and courteous</li>
                  <li>The recipient can accept or decline your request</li>
                </ul>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !formData.message.trim()}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Send Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
