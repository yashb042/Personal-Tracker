import React, { useState, useEffect } from 'react';
export default Notes;

}
  );
    </div>
      )}
        </div>
          </div>
            </form>
              </div>
                </button>
                  {editingNote ? 'Update' : 'Create'}
                <button type="submit" className="btn btn-primary">
                </button>
                  Cancel
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
              <div className="modal-footer">
              </div>
                </div>
                  ))}
                    </label>
                      </span>
                        {label.name}
                      >
                        style={{ backgroundColor: label.color }}
                        className="label-badge"
                      <span
                      />
                        onChange={() => handleLabelToggle(label.id)}
                        checked={formData.labelIds.includes(label.id)}
                        type="checkbox"
                      <input
                    <label key={label.id} className="checkbox-label">
                  {labels.map(label => (
                <div className="label-selector">
                <label>Labels</label>
              <div className="input-group">
              </div>
                />
                  rows="6"
                  placeholder="Enter note content..."
                  required
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  value={formData.content}
                <textarea
                <label>Content</label>
              <div className="input-group">
              </div>
                />
                  placeholder="Enter note title..."
                  required
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  value={formData.title}
                  type="text"
                <input
                <label>Title</label>
              <div className="input-group">
            <form onSubmit={handleSubmit}>
            </div>
              <button className="modal-close" onClick={resetForm}>×</button>
              <h2>{editingNote ? 'Edit Note' : 'New Note'}</h2>
            <div className="modal-header">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-overlay" onClick={resetForm}>
      {showModal && (

      )}
        </div>
          <p>Create your first note to get started!</p>
          <h3>No notes found</h3>
        <div className="empty-state">
      {filteredNotes.length === 0 && (

      </div>
        ))}
          </div>
            </div>
              </div>
                </button>
                  🗑️ Delete
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(note.id)}>
                </button>
                  ✏️ Edit
                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(note)}>
              <div className="note-actions">
              </span>
                {new Date(note.updatedAt).toLocaleDateString()}
              <span className="note-date">
            <div className="note-footer">
            </div>
              })}
                ) : null;
                  </span>
                    {label.name}
                  >
                    style={{ backgroundColor: label.color }}
                    className="note-label"
                    key={labelId}
                  <span
                return label ? (
                const label = getLabelInfo(labelId);
              {note.labelIds && note.labelIds.map(labelId => {
            <div className="note-labels">
            <p>{note.content}</p>
            <h3>{note.title}</h3>
          <div key={note.id} className="note-card fade-in">
        {filteredNotes.map(note => (
      <div className="notes-grid">

      </div>
        </select>
          ))}
            <option key={label.id} value={label.id}>{label.name}</option>
          {labels.map(label => (
          <option value="">All Labels</option>
        >
          className="filter-select"
          onChange={(e) => setFilterLabel(e.target.value)}
          value={filterLabel}
        <select
        />
          className="search-input"
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          placeholder="🔍 Search notes..."
          type="text"
        <input
      <div className="notes-filters">

      </div>
        </button>
          ➕ New Note
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        <h2>📝 My Notes</h2>
      <div className="notes-header">
    <div className="notes-container">
  return (

  });
    return matchesSearch && matchesLabel;
    const matchesLabel = !filterLabel || note.labelIds.includes(filterLabel);
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  const filteredNotes = notes.filter(note => {

  };
    return labels.find(l => l.id === labelId);
  const getLabelInfo = (labelId) => {

  };
    }));
        : [...prev.labelIds, labelId]
        ? prev.labelIds.filter(id => id !== labelId)
      labelIds: prev.labelIds.includes(labelId)
      ...prev,
    setFormData(prev => ({
  const handleLabelToggle = (labelId) => {

  };
    setShowModal(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', labelIds: [] });
  const resetForm = () => {

  };
    setShowModal(true);
    });
      labelIds: note.labelIds || []
      content: note.content,
      title: note.title,
    setFormData({
    setEditingNote(note);
  const handleEdit = (note) => {

  };
    }
      }
        console.error('Error deleting note:', error);
      } catch (error) {
        fetchNotes();
        await axios.delete(`/api/notes/${id}`);
      try {
    if (window.confirm('Are you sure you want to delete this note?')) {
  const handleDelete = async (id) => {

  };
    }
      console.error('Error saving note:', error);
    } catch (error) {
      resetForm();
      fetchNotes();
      }
        await axios.post('/api/notes', formData);
      } else {
        await axios.put(`/api/notes/${editingNote.id}`, formData);
      if (editingNote) {
    try {
    e.preventDefault();
  const handleSubmit = async (e) => {

  };
    }
      console.error('Error fetching labels:', error);
    } catch (error) {
      setLabels(response.data);
      const response = await axios.get('/api/labels');
    try {
  const fetchLabels = async () => {

  };
    }
      console.error('Error fetching notes:', error);
    } catch (error) {
      setNotes(response.data);
      const response = await axios.get('/api/notes');
    try {
  const fetchNotes = async () => {

  }, []);
    fetchLabels();
    fetchNotes();
  useEffect(() => {

  });
    labelIds: []
    content: '',
    title: '',
  const [formData, setFormData] = useState({
  const [filterLabel, setFilterLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [labels, setLabels] = useState([]);
  const [notes, setNotes] = useState([]);
function Notes() {

import './Notes.css';
import axios from 'axios';

