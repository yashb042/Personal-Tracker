import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Notes from './components/Notes';
import Labels from './components/Labels';
import DailyTracker from './components/DailyTracker';
import Settings from './components/Settings';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Daily Tracker', icon: '📊' },
    { path: '/notes', label: 'Notes', icon: '📝' },
    { path: '/labels', label: 'Labels', icon: '🏷️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>📌 Personal Tracker</h1>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DailyTracker />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/labels" element={<Labels />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
