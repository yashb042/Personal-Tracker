import React, { useState, useEffect } from 'react';
export default App;

}
  );
    </Router>
      </div>
        </main>
          </Routes>
            <Route path="/settings" element={<Settings />} />
            <Route path="/tracker" element={<DailyTracker />} />
            <Route path="/labels" element={<Labels />} />
            <Route path="/" element={<Notes />} />
          <Routes>
        <main className="main-content">
        <Navigation />
      <div className="App">
    <Router>
  return (
function App() {

}
  );
    </nav>
      </ul>
        ))}
          </li>
            </Link>
              {item.label}
              <span className="nav-icon">{item.icon}</span>
            >
              className={location.pathname === item.path ? 'active' : ''}
              to={item.path}
            <Link
          <li key={item.path}>
        {navItems.map((item) => (
      <ul className="nav-links">
      </div>
        <h1>📌 Personal Tracker</h1>
      <div className="nav-brand">
    <nav className="navbar">
  return (

  ];
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/tracker', label: 'Daily Tracker', icon: '📊' },
    { path: '/labels', label: 'Labels', icon: '🏷️' },
    { path: '/', label: 'Notes', icon: '📝' },
  const navItems = [

  const location = useLocation();
function Navigation() {

import Settings from './components/Settings';
import DailyTracker from './components/DailyTracker';
import Labels from './components/Labels';
import Notes from './components/Notes';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

