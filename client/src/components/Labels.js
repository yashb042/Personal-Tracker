import React, { useState, useEffect } from 'react';
export default Labels;

}
  );
    </div>
      )}
        </div>
          </div>
            </form>
              </div>
                </button>
                  {editingLabel ? 'Update' : 'Create'}
                <button type="submit" className="btn btn-primary">
                </button>
                  Cancel
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
              <div className="modal-footer">
              </div>
                </div>
                  />
                    placeholder="#000000"
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    value={formData.color}
                    type="text"
                  <input
                  />
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    value={formData.color}
                    type="color"
                  <input
                <div className="color-picker">
                <label>Color</label>
              <div className="input-group">
              </div>
                />
                  placeholder="Enter label name..."
                  required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  value={formData.name}
                  type="text"
                <input
                <label>Label Name</label>
              <div className="input-group">
            <form onSubmit={handleSubmit}>
            </div>
              <button className="modal-close" onClick={resetForm}>×</button>
              <h2>{editingLabel ? 'Edit Label' : 'New Label'}</h2>
            <div className="modal-header">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-overlay" onClick={resetForm}>
      {showModal && (

      </div>
        </div>
          )}
            </div>
              <p>Click on a label from the sidebar to see all notes with that label</p>
              <h3>Select a label to view its notes</h3>
            <div className="empty-state">
          ) : (
            </>
              )}
                </div>
                  <p>Assign this label to notes from the Notes page</p>
                  <h4>No notes with this label</h4>
                <div className="empty-state">
              ) : (
                </div>
                  ))}
                    </div>
                      </div>
                        </span>
                          {new Date(note.updatedAt).toLocaleDateString()}
                        <span className="note-date">
                      <div className="note-meta">
                      <p>{note.content}</p>
                      <h4>{note.title}</h4>
                    <div key={note.id} className="note-card fade-in">
                  {labeledNotes.map(note => (
                <div className="notes-grid">
              {labeledNotes.length > 0 ? (

              </div>
                </span>
                  {labeledNotes.length} {labeledNotes.length === 1 ? 'note' : 'notes'}
                <span className="notes-count">
                </div>
                  <h3>{selectedLabel.name}</h3>
                  />
                    style={{ backgroundColor: selectedLabel.color }}
                    className="label-color-circle"
                  <div
                <div className="label-title">
              <div className="label-header">
            <>
          {selectedLabel ? (
        <div className="labels-main">

        </div>
          )}
            </div>
              <p>No labels yet. Create one to organize your notes!</p>
            <div className="empty-message">
          {labels.length === 0 && (
          </div>
            ))}
              </div>
                </div>
                  </button>
                    🗑️
                  >
                    }}
                      handleDelete(label.id);
                      e.stopPropagation();
                    onClick={(e) => {
                    className="icon-btn"
                  <button
                  </button>
                    ✏️
                  >
                    }}
                      handleEdit(label);
                      e.stopPropagation();
                    onClick={(e) => {
                    className="icon-btn"
                  <button
                <div className="label-actions">
                </div>
                  </span>
                    {getNotesForLabel(label.id).length}
                  <span className="label-count">
                  <span className="label-name">{label.name}</span>
                  />
                    style={{ backgroundColor: label.color }}
                    className="label-color-dot"
                  <div
                <div className="label-info">
              >
                onClick={() => setSelectedLabel(label)}
                className={`label-item ${selectedLabel?.id === label.id ? 'active' : ''}`}
                key={label.id}
              <div
            {labels.map(label => (
          <div className="labels-list">
          <h3>All Labels ({labels.length})</h3>
        <div className="labels-sidebar">
      <div className="labels-content">

      </div>
        </button>
          ➕ New Label
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        <h2>🏷️ Labels</h2>
      <div className="labels-header">
    <div className="labels-container">
  return (

  const labeledNotes = selectedLabel ? getNotesForLabel(selectedLabel.id) : [];

  };
    return notes.filter(note => note.labelIds && note.labelIds.includes(labelId));
  const getNotesForLabel = (labelId) => {

  };
    setShowModal(false);
    setEditingLabel(null);
    });
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
      name: '',
    setFormData({
  const resetForm = () => {

  };
    setShowModal(true);
    });
      color: label.color
      name: label.name,
    setFormData({
    setEditingLabel(label);
  const handleEdit = (label) => {

  };
    }
      }
        console.error('Error deleting label:', error);
      } catch (error) {
        }
          setSelectedLabel(null);
        if (selectedLabel?.id === id) {
        fetchNotes();
        fetchLabels();
        await axios.delete(`/api/labels/${id}`);
      try {
    if (window.confirm('Are you sure? This will remove the label from all notes.')) {
  const handleDelete = async (id) => {

  };
    }
      console.error('Error saving label:', error);
    } catch (error) {
      resetForm();
      fetchLabels();
      }
        await axios.post('/api/labels', formData);
      } else {
        await axios.put(`/api/labels/${editingLabel.id}`, formData);
      if (editingLabel) {
    try {
    e.preventDefault();
  const handleSubmit = async (e) => {

  };
    }
      console.error('Error fetching notes:', error);
    } catch (error) {
      setNotes(response.data);
      const response = await axios.get('/api/notes');
    try {
  const fetchNotes = async () => {

  };
    }
      console.error('Error fetching labels:', error);
    } catch (error) {
      setLabels(response.data);
      const response = await axios.get('/api/labels');
    try {
  const fetchLabels = async () => {

  }, []);
    fetchNotes();
    fetchLabels();
  useEffect(() => {

  });
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
    name: '',
  const [formData, setFormData] = useState({
  const [editingLabel, setEditingLabel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [notes, setNotes] = useState([]);
  const [labels, setLabels] = useState([]);
function Labels() {

import './Labels.css';
import axios from 'axios';

