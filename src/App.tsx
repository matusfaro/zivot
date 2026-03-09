import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LiveDashboard } from './components/dashboard/LiveDashboard';
import './App.css';
import './styles/relationship-graph.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LiveDashboard />} />
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
