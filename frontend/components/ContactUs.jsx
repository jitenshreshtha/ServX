// components/ContactUs.jsx
import React, { useState } from 'react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim() || 'General Inquiry',
          message: formData.message.trim()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setErrors({});
  };

  return (
    <section className="py-5">
      <div className="container">
        {/* Header */}
        <div className="row mb-5">
          <div className="col-lg-8 mx-auto text-center">
            <h2 className="display-5 fw-bold mb-3">Contact Us</h2>
            <p className="lead text-muted">
              Have a question, suggestion, or need help? We'd love to hear from you!
            </p>
          </div>
        </div>

        <div className="row">
          {/* Contact Information */}
          <div className="col-lg-4 mb-5">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title mb-4">
                  <i className="bi bi-info-circle text-primary me-2"></i>
                  Get in Touch
                </h5>
                
                <div className="mb-4">
                  <h6 className="fw-bold">
                    <i className="bi bi-envelope text-primary me-2"></i>
                    Email Us
                  </h6>
                  <p className="text-muted mb-0">
                    Send us a message and we'll respond as soon as possible.
                  </p>
                </div>
                
                <div className="mb-4">
                  <h6 className="fw-bold">
                    <i className="bi bi-clock text-primary me-2"></i>
                    Response Time
                  </h6>
                  <p className="text-muted mb-0">
                    We typically respond within 24-48 hours.
                  </p>
                </div>
                
                <div className="mb-4">
                  <h6 className="fw-bold">
                    <i className="bi bi-shield-check text-primary me-2"></i>
                    Privacy
                  </h6>
                  <p className="text-muted mb-0">
                    Your information is secure and will only be used to respond to your inquiry.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <h6 className="fw-bold mb-3">Quick Links</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <a href="/about" className="text-decoration-none">
                        <i className="bi bi-arrow-right text-primary me-2"></i>
                        Learn About ServX
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/signup" className="text-decoration-none">
                        <i className="bi bi-arrow-right text-primary me-2"></i>
                        Create Account
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/" className="text-decoration-none">
                        <i className="bi bi-arrow-right text-primary me-2"></i>
                        Browse Skills
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {submitted ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="text-success mb-3">Message Sent Successfully!</h4>
                    <p className="text-muted mb-4">
                      Thank you for contacting us. We've received your message and will get back to you soon.
                    </p>
                    <button 
                      className="btn btn-primary"
                      onClick={resetForm}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h5 className="card-title mb-4">
                      <i className="bi bi-envelope text-primary me-2"></i>
                      Send us a Message
                    </h5>
                    
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="name" className="form-label">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                          />
                          {errors.name && (
                            <div className="invalid-feedback">{errors.name}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="email" className="form-label">
                            Your Email *
                          </label>
                          <input
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            required
                          />
                          {errors.email && (
                            <div className="invalid-feedback">{errors.email}</div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="subject" className="form-label">
                          Subject
                        </label>
                        <select
                          className="form-select"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                        >
                          <option value="">Select a subject (optional)</option>
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Account Help">Account Help</option>
                          <option value="Feature Request">Feature Request</option>
                          <option value="Bug Report">Bug Report</option>
                          <option value="Partnership">Partnership Opportunity</option>
                          <option value="Feedback">Feedback</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="message" className="form-label">
                          Your Message *
                        </label>
                        <textarea
                          className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                          id="message"
                          name="message"
                          rows="6"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Please describe your inquiry in detail..."
                          required
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
                            {formData.message.length}/1000
                          </small>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Fields marked with * are required
                        </div>
                        
                        <button 
                          type="submit" 
                          className="btn btn-primary px-4"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-send me-2"></i>
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card border-0 bg-light">
              <div className="card-body p-4">
                <h5 className="card-title text-center mb-4">
                  <i className="bi bi-question-circle text-primary me-2"></i>
                  Frequently Asked Questions
                </h5>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold">How does ServX work?</h6>
                    <p className="text-muted mb-0">
                      ServX allows users to exchange skills without money. You offer your expertise 
                      in exchange for someone else's skills.
                    </p>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold">Is ServX free to use?</h6>
                    <p className="text-muted mb-0">
                      Yes! ServX is completely free to use. We don't charge any transaction fees 
                      for skill exchanges.
                    </p>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold">How do I get started?</h6>
                    <p className="text-muted mb-0">
                      Simply create an account, complete your profile with your skills, and start 
                      browsing or posting skill exchange opportunities.
                    </p>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold">What if I need help?</h6>
                    <p className="text-muted mb-0">
                      Use this contact form to reach out to us! We're here to help with any 
                      questions or issues you might have.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;