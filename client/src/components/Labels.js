import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Labels.css';

function Labels() {
  const [labels, setLabels] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  });

  useEffect(() => {
    fetchLabels();
    fetchNotes();
  }, []);

  const fetchLabels = async () => {
    try {
      const response = await axios.get('/api/labels');
      setLabels(response.data);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await axios.get('/api/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLabel) {
        await axios.put(`/api/labels/${editingLabel.id}`, formData);
      } else {
        await axios.post('/api/labels', formData);
      }
      fetchLabels();
      resetForm();
    } catch (error) {
      console.error('Error saving label:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will remove the label from all notes.')) {
      try {
        await axios.delete(`/api/labels/${id}`);
        fetchLabels();
        fetchNotes();
        if (selectedLabel?.id === id) {
          setSelectedLabel(null);
        }
      } catch (error) {
        console.error('Error deleting label:', error);
      }
    }
  };

  const handleEdit = (label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
    setEditingLabel(null);
    setShowModal(false);
  };

  const getNotesForLabel = (labelId) => {
    return notes.filter(note => note.labelIds && note.labelIds.includes(labelId));
  };

  const labeledNotes = selectedLabel ? getNotesForLabel(selectedLabel.id) : [];

  return (
    <div className="labels-container">
      <div className="labels-header">
        <h2>🏷️ Labels</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ New Label
        </button>
      </div>

      <div className="labels-content">
        <div className="labels-sidebar">
          <h3>All Labels ({labels.length})</h3>
          <div className="labels-list">
            {labels.map(label => (
              <div
                key={label.id}
                className={`label-item ${selectedLabel?.id === label.id ? 'active' : ''}`}
                onClick={() => setSelectedLabel(label)}
              >
                <div className="label-info">
                  <div
                    className="label-color-dot"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="label-name">{label.name}</span>
                  <span className="label-count">
                    {getNotesForLabel(label.id).length}
                  </span>
                </div>
                <div className="label-actions">
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(label);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(label.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          {labels.length === 0 && (
            <div className="empty-message">
              <p>No labels yet. Create one to organize your notes!</p>
            </div>
          )}
        </div>

        <div className="labels-main">
          {selectedLabel ? (
            <>
              <div className="label-header">
                <div className="label-title">
                  <div
                    className="label-color-circle"
                    style={{ backgroundColor: selectedLabel.color }}
                  />
                  <h3>{selectedLabel.name}</h3>
                </div>
                <span className="notes-count">
                  {labeledNotes.length} {labeledNotes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>

              {labeledNotes.length > 0 ? (
                <div className="notes-grid">
                  {labeledNotes.map(note => (
                    <div key={note.id} className="note-card fade-in">
                      <h4>{note.title}</h4>
                      <p>{note.content}</p>
                      <div className="note-meta">
                        <span className="note-date">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h4>No notes with this label</h4>
                  <p>Assign this label to notes from the Notes page</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>Select a label to view its notes</h3>
              <p>Click on a label from the sidebar to see all notes with that label</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLabel ? 'Edit Label' : 'New Label'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Label Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter label name..."
                />
              </div>
              <div className="input-group">
                <label>Color</label>
                <div className="color-picker">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLabel ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Labels;
