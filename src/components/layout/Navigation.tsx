import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navigation: React.FC = () => {
  return (
    <nav className="app-navigation">
      <ul className="nav-list">
        <li>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            📝 Your Profile
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/results"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            📊 Risk Results
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
