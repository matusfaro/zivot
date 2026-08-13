import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LiveDashboard } from './components/dashboard/LiveDashboard';
import { ProfilePicker } from './components/profile/ProfilePicker';
import { profileRepository } from './database/repositories/ProfileRepository';
import './App.css';
import './styles/relationship-graph.css';
import './styles/theme.css';

// E2E tests exercise the dashboard directly against a cleared database —
// bypass the picker and use the legacy first-profile behavior there.
// navigator.webdriver covers automated browsers even when the dev server was
// started without the env var (e.g., a reused server).
const E2E_MODE =
  import.meta.env.VITE_E2E_TEST_MODE === 'true' ||
  (typeof navigator !== 'undefined' && navigator.webdriver === true);

function App() {
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    E2E_MODE ? 'e2e-default' : null
  );

  if (!activeProfileId) {
    return (
      <div className="app">
        <ProfilePicker onSelected={setActiveProfileId} />
      </div>
    );
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app">
        <Routes>
          <Route
            path="/:tab?"
            element={
              <LiveDashboard
                key={activeProfileId}
                onSwitchProfile={() => {
                  profileRepository.setActiveProfile(null);
                  setActiveProfileId(null);
                }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="app-footer">
          <p>
            &copy; 2025 Zivot Health Risk Calculator. For educational purposes only. Not
            medical advice.
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
