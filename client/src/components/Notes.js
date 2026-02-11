import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Notes.css';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    labelIds: []
  });

  useEffect(() => {
    fetchNotes();
    fetchLabels();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('/api/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await axios.get('/api/labels');
      setLabels(response.data);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await axios.put(`/api/notes/${editingNote.id}`, formData);
      } else {
        await axios.post('/api/notes', formData);
      }
      fetchNotes();
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`/api/notes/${id}`);
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      labelIds: note.labelIds || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', labelIds: [] });
    setEditingNote(null);
    setShowModal(false);
  };

  const handleLabelToggle = (labelId) => {
    setFormData(prev => ({
      ...prev,
      labelIds: prev.labelIds.includes(labelId)
        ? prev.labelIds.filter(id => id !== labelId)
        : [...prev.labelIds, labelId]
    }));
  };

  const getLabelInfo = (labelId) => {
    return labels.find(l => l.id === labelId);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLabel = !filterLabel || note.labelIds.includes(filterLabel);
    return matchesSearch && matchesLabel;
  });

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h2>📝 My Notes</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ New Note
        </button>
      </div>

      <div className="notes-filters">
        <input
          type="text"
          placeholder="🔍 Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={filterLabel}
          onChange={(e) => setFilterLabel(e.target.value)}
          className="filter-select"
        >
          <option value="">All Labels</option>
          {labels.map(label => (
            <option key={label.id} value={label.id}>{label.name}</option>
          ))}
        </select>
      </div>

      <div className="notes-grid">
        {filteredNotes.map(note => (
          <div key={note.id} className="note-card fade-in">
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <div className="note-labels">
              {note.labelIds && note.labelIds.map(labelId => {
                const label = getLabelInfo(labelId);
                return label ? (
                  <span
                    key={labelId}
                    className="note-label"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ) : null;
              })}
            </div>
            <div className="note-footer">
              <span className="note-date">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
              <div className="note-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(note)}>
                  ✏️ Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(note.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="empty-state">
          <h3>No notes found</h3>
          <p>Create your first note to get started!</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNote ? 'Edit Note' : 'New Note'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter note title..."
                />
              </div>
              <div className="input-group">
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  placeholder="Enter note content..."
                  rows="6"
                />
              </div>
              <div className="input-group">
                <label>Labels</label>
                <div className="label-selector">
                  {labels.map(label => (
                    <label key={label.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.labelIds.includes(label.id)}
                        onChange={() => handleLabelToggle(label.id)}
                      />
                      <span
                        className="label-badge"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingNote ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
