import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

interface TopBarProps {
  profileName?: string;
  /** 10-year survival percentage (0-100), null while unknown */
  survivalPercent: number | null;
  calculating?: boolean;
  error?: Error | null;
  onSwitchProfile?: () => void;
  onLogoDoubleClick?: () => void;
}

const TABS: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Overview', end: true },
  { to: '/survey', label: 'Survey' },
  { to: '/profile', label: 'Profile' },
  { to: '/habits', label: 'Habits' },
  { to: '/explore', label: 'Explore' },
];

type ThemeChoice = 'system' | 'light' | 'dark';

function applyTheme(choice: ThemeChoice) {
  if (choice === 'system') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = choice;
  }
}

/**
 * Persistent app shell header: brand, view tabs, always-visible survival
 * chip (live feedback while editing anywhere), theme toggle, profile switch.
 */
export const TopBar: React.FC<TopBarProps> = ({
  profileName,
  survivalPercent,
  calculating,
  error,
  onSwitchProfile,
  onLogoDoubleClick,
}) => {
  const [theme, setTheme] = useState<ThemeChoice>(
    () => (localStorage.getItem('zivot.theme') as ThemeChoice) || 'system'
  );

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('zivot.theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(prev => (prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system'));
  };

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🌗';

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div
          className="topbar-brand"
          onDoubleClick={onLogoDoubleClick}
          title="Zivot — personal survival calculator"
        >
          Zivot
        </div>

        <nav className="topbar-nav" aria-label="Main">
          {TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-right">
          <div className="survival-chip" aria-live="polite" title="10-year survival estimate">
            <span className="chip-label">10-yr survival</span>
            {error ? (
              <span className="chip-value" style={{ color: 'var(--color-danger)' }}>error</span>
            ) : survivalPercent === null ? (
              <span className="chip-updating">…</span>
            ) : (
              <span className="chip-value">{survivalPercent.toFixed(1)}%</span>
            )}
            {calculating && <span className="chip-updating">Updating…</span>}
          </div>

          <button className="icon-button" onClick={cycleTheme} title={`Theme: ${theme}`} aria-label={`Theme: ${theme}, click to change`}>
            {themeIcon}
          </button>

          {onSwitchProfile && (
            <button className="profile-chip" onClick={onSwitchProfile} title="Switch profile">
              👤 {profileName || 'profile'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
