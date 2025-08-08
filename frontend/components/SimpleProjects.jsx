// components/SimpleProjects.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText); // Debug log
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Projects data:', data); // Debug log
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (projectId, newStatus, progress = null) => {
    try {
      const token = localStorage.getItem('token');
      const body = { status: newStatus };
      if (progress !== null) body.progress = progress;

      const response = await fetch(`http://localhost:3000/projects/${projectId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchProjects(); // Refresh the list
        alert('Status updated!');
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const addNote = async (projectId) => {
    const note = prompt('Add a note about this project:');
    if (!note) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/projects/${projectId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });

      if (response.ok) {
        fetchProjects();
        alert('Note added!');
      }
    } catch (error) {
      alert('Failed to add note');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      started: 'bg-info',
      in_progress: 'bg-warning',
      completed: 'bg-success',
      cancelled: 'bg-danger'
    };
    return <span className={`badge ${colors[status]}`}>{status.replace('_', ' ')}</span>;
  };

  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-3">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Projects</h2>
        <span className="text-muted">{projects.length} active collaborations</span>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-5">
          <h4>No Projects Yet</h4>
          <p className="text-muted">Your skill exchange collaborations will appear here</p>
          <button className="btn btn-primary" onClick={() => navigate('/requests')}>
            Check Requests
          </button>
        </div>
      ) : (
        <div className="row">
          {projects.map(project => {
            const currentUserId = getCurrentUserId();
            const isRequester = project.requester._id === currentUserId;
            const collaborator = isRequester ? project.provider : project.requester;

            return (
              <div key={project._id} className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="card-title">{project.title}</h5>
                      {getStatusBadge(project.status)}
                    </div>

                    <div className="mb-3">
                      <strong>Collaborating with:</strong> {collaborator.name}
                    </div>

                    <div className="row mb-3">
                      <div className="col-6">
                        <small className="text-muted">Offering:</small>
                        <div className="fw-bold text-success">{project.skills.offered}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Seeking:</small>
                        <div className="fw-bold text-primary">{project.skills.wanted}</div>
                      </div>
                    </div>

                    {/* Simple Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small>Progress</small>
                        <small>{project.progress}%</small>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="d-flex gap-2 mb-3">
                      {project.status === 'started' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => updateStatus(project._id, 'in_progress', 25)}
                        >
                          Start Working
                        </button>
                      )}

                      {project.status === 'in_progress' && (
                        <>
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => {
                              const progress = prompt('Update progress (0-100):');
                              if (progress) updateStatus(project._id, 'in_progress', parseInt(progress));
                            }}
                          >
                            Update Progress
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => updateStatus(project._id, 'completed', 100)}
                          >
                            Mark Complete
                          </button>
                        </>
                      )}

                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => addNote(project._id)}
                      >
                        Add Note
                      </button>
                    </div>

                    {/* Recent Notes */}
                    {project.notes && project.notes.length > 0 && (
                      <div className="border-top pt-2">
                        <small className="text-muted">Latest note:</small>
                        <div className="small">
                          "{project.notes[project.notes.length - 1].content}"
                        </div>
                      </div>
                    )}

                    <div className="text-muted small mt-2">
                      Updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SimpleProjects;