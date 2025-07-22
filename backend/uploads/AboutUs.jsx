// components/AboutUs.jsx
import React from 'react';

const AboutUs = () => {
  const teamMembers = [
    {
      name: "Jiten Shreshtha",
      id: "8980448",
      role: "Full Stack Developer",
      image: "/profile.png"
    },
    {
      name: "Harikumaran Durairaju", 
      id: "8995268",
      role: "Backend Developer",
      image: "/profile.png"
    },
    {
      name: "Nithin Mamidi",
      id: "9002544", 
      role: "Frontend Developer",
      image: "/profile.png"
    }
  ];

  const technologies = [
    { name: "JavaScript", icon: "🟨", description: "Core programming language" },
    { name: "React.js", icon: "⚛️", description: "Frontend framework" },
    { name: "Node.js", icon: "🟢", description: "Backend runtime" },
    { name: "MongoDB", icon: "🍃", description: "NoSQL database" },
    { name: "Express.js", icon: "🚀", description: "Web framework" },
    { name: "Socket.IO", icon: "🔌", description: "Real-time communication" },
    { name: "JWT", icon: "🔐", description: "Authentication" },
    { name: "Git/GitHub", icon: "📚", description: "Version control" }
  ];

  const features = [
    {
      icon: "bi-arrow-left-right",
      title: "Skill-Based Exchange",
      description: "Trade your skills for others' expertise without monetary transactions"
    },
    {
      icon: "bi-chat-dots",
      title: "Real-Time Communication", 
      description: "Negotiate and collaborate through our integrated chat system"
    },
    {
      icon: "bi-geo-alt",
      title: "Location-Based Matching",
      description: "Connect with skilled professionals in your local area"
    },
    {
      icon: "bi-star",
      title: "Review System",
      description: "Build trust through peer reviews and ratings"
    },
    {
      icon: "bi-shield-check",
      title: "Secure Platform",
      description: "JWT authentication ensures safe and secure interactions"
    },
    {
      icon: "bi-people",
      title: "Community Building",
      description: "Foster professional networks and collaborative relationships"
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">About ServX</h1>
              <p className="lead mb-4">
                Revolutionizing how people exchange skills and services through a collaborative, 
                community-driven platform that values expertise over currency.
              </p>
              <div className="d-flex align-items-center">
                <div className="me-4">
                  <h5 className="mb-0">PROG8751</h5>
                  <small>Capstone Project</small>
                </div>
                <div className="me-4">
                  <h5 className="mb-0">4th Semester</h5>
                  <small>Web Development</small>
                </div>
                <div>
                  <h5 className="mb-0">Group 6</h5>
                  <small>Team Project</small>
                </div>
              </div>
            </div>
            <div className="col-lg-4 text-center">
              <img 
                src="/logo.png" 
                alt="ServX Logo" 
                className="img-fluid rounded-circle shadow"
                style={{ maxWidth: "200px", height: "200px", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="display-5 fw-bold mb-4">Our Mission</h2>
              <p className="lead text-muted mb-4">
                ServX is a web-based platform designed to facilitate skill-based service exchanges 
                between individuals. Rather than using digital forms of payment or cash, users can 
                exchange services based on a mutually accepted value of skills.
              </p>
              <div className="row mt-5">
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: "60px", height: "60px" }}>
                      <i className="bi bi-lightbulb fs-4"></i>
                    </div>
                    <h5>Innovation</h5>
                    <p className="text-muted">
                      Creating an alternative economy grounded in skill equivalency
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: "60px", height: "60px" }}>
                      <i className="bi bi-people fs-4"></i>
                    </div>
                    <h5>Collaboration</h5>
                    <p className="text-muted">
                      Encouraging negotiation and sharing of specialized talents
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: "60px", height: "60px" }}>
                      <i className="bi bi-graph-up fs-4"></i>
                    </div>
                    <h5>Growth</h5>
                    <p className="text-muted">
                      Promoting professional development and trust-based networks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">How ServX Works</h2>
            <p className="lead text-muted">
              A simple process to exchange skills and build professional relationships
            </p>
          </div>
          
          <div className="row">
            <div className="col-lg-6 mb-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: "40px", height: "40px", flexShrink: 0 }}>
                      <span className="fw-bold">1</span>
                    </div>
                    <div>
                      <h5>Create Your Profile</h5>
                      <p className="text-muted mb-0">
                        Showcase your skills, experience, and what services you can offer or need.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: "40px", height: "40px", flexShrink: 0 }}>
                      <span className="fw-bold">2</span>
                    </div>
                    <div>
                      <h5>Browse & Connect</h5>
                      <p className="text-muted mb-0">
                        Search for skills you need or find people who want what you offer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: "40px", height: "40px", flexShrink: 0 }}>
                      <span className="fw-bold">3</span>
                    </div>
                    <div>
                      <h5>Negotiate & Plan</h5>
                      <p className="text-muted mb-0">
                        Use our real-time chat to discuss project details and skill exchange terms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-start">
                    <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: "40px", height: "40px", flexShrink: 0 }}>
                      <span className="fw-bold">4</span>
                    </div>
                    <div>
                      <h5>Exchange & Review</h5>
                      <p className="text-muted mb-0">
                        Complete your skill exchange and leave reviews to build trust in the community.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="display-6 fw-bold mb-4">Real-World Example</h2>
              <div className="card border-primary">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary text-white rounded-circle p-3 me-3">
                      <i className="bi bi-code-slash fs-4"></i>
                    </div>
                    <div>
                      <h6 className="mb-0">Web Developer</h6>
                      <small className="text-muted">Offers: Portfolio Website Design</small>
                    </div>
                  </div>
                  
                  <div className="text-center my-3">
                    <i className="bi bi-arrow-left-right fs-2 text-success"></i>
                    <div><small className="text-success fw-bold">SKILL EXCHANGE</small></div>
                  </div>
                  
                  <div className="d-flex align-items-center">
                    <div className="bg-warning text-dark rounded-circle p-3 me-3">
                      <i className="bi bi-hammer fs-4"></i>
                    </div>
                    <div>
                      <h6 className="mb-0">Carpenter</h6>
                      <small className="text-muted">Offers: Custom Furniture</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="ps-lg-4">
                <p className="lead">
                  A web developer collaborates with a carpenter to design a portfolio website 
                  in exchange for custom furniture. Both parties benefit from professional 
                  services without monetary transactions.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    No money changes hands
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Mutually beneficial exchange
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Professional network building
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Skill development opportunity
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Platform Features</h2>
            <p className="lead text-muted">
              Everything you need for successful skill exchanges
            </p>
          </div>
          
          <div className="row">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-4 col-md-6 mb-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: "60px", height: "60px" }}>
                      <i className={`bi ${feature.icon} fs-4`}></i>
                    </div>
                    <h5 className="card-title">{feature.title}</h5>
                    <p className="card-text text-muted">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Technology Stack</h2>
            <p className="lead text-muted">
              Built with modern, industry-standard technologies
            </p>
          </div>
          
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="row">
                {technologies.map((tech, index) => (
                  <div key={index} className="col-md-6 col-lg-3 mb-4">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center p-3">
                        <div className="fs-1 mb-2">{tech.icon}</div>
                        <h6 className="card-title">{tech.name}</h6>
                        <small className="text-muted">{tech.description}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-4">
                <p className="text-muted">
                  <strong>MERN Stack:</strong> We chose MongoDB, Express.js, React.js, and Node.js 
                  for rapid full-stack development using JavaScript across all layers, 
                  simplifying development and increasing maintainability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Meet Our Team</h2>
            <p className="lead">
              Group 6 - Passionate developers building the future of skill exchange
            </p>
          </div>
          
          <div className="row justify-content-center">
            {teamMembers.map((member, index) => (
              <div key={index} className="col-lg-4 col-md-6 mb-4">
                <div className="card bg-white text-dark h-100 border-0 shadow">
                  <div className="card-body text-center p-4">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="rounded-circle mb-3"
                      style={{ width: "80px", height: "80px", objectFit: "cover" }}
                    />
                    <h5 className="card-title">{member.name}</h5>
                    <p className="text-primary fw-bold">{member.role}</p>
                    <small className="text-muted">Student ID: {member.id}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <p className="mb-2">
              <strong>Supervised by:</strong> Milan Sebastian Jacob
            </p>
            <p className="mb-0">
              <strong>Project Duration:</strong> 6 weeks with weekly milestones
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="display-6 fw-bold mb-4">Our Vision</h2>
              <p className="lead text-muted mb-4">
                ServX aims to empower individuals to collaborate and share services without 
                monetary transactions. The platform promotes professional growth, community 
                networking, and innovation.
              </p>
              
              <div className="row">
                <div className="col-6">
                  <div className="text-center">
                    <h3 className="text-primary fw-bold">100%</h3>
                    <p className="small text-muted">Skill-Based</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center">
                    <h3 className="text-success fw-bold">0$</h3>
                    <p className="small text-muted">Transaction Fees</p>
                  </div>
                </div>
              </div>
              
              <p className="text-muted">
                We believe that everyone has valuable skills to offer, and our platform 
                makes it easy to find others who can benefit from those skills while 
                providing something valuable in return.
              </p>
            </div>
            
            <div className="col-lg-6">
              <div className="ps-lg-4">
                <div className="card border-0 shadow-lg">
                  <div className="card-body p-4">
                    <h5 className="card-title">Why Choose ServX?</h5>
                    <ul className="list-unstyled">
                      <li className="mb-3">
                        <i className="bi bi-shield-check text-success me-3"></i>
                        <strong>Secure Platform:</strong> JWT authentication and secure communications
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-geo-alt text-primary me-3"></i>
                        <strong>Local Connections:</strong> Find skilled professionals nearby
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-chat-dots text-info me-3"></i>
                        <strong>Real-Time Chat:</strong> Communicate instantly with potential partners
                      </li>
                      <li className="mb-3">
                        <i className="bi bi-star text-warning me-3"></i>
                        <strong>Trust System:</strong> Reviews and ratings build community trust
                      </li>
                      <li className="mb-0">
                        <i className="bi bi-globe text-success me-3"></i>
                        <strong>Growing Network:</strong> Access to diverse skills and talents
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container text-center text-white">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <h2 className="display-5 fw-bold mb-4">Ready to Start Exchanging Skills?</h2>
              <p className="lead mb-4">
                Join our community of skilled professionals and start building 
                meaningful collaborations today.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <a href="/signup" className="btn btn-light btn-lg px-4">
                  <i className="bi bi-person-plus me-2"></i>
                  Sign Up Now
                </a>
                <a href="/contact" className="btn btn-outline-light btn-lg px-4">
                  <i className="bi bi-envelope me-2"></i>
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;