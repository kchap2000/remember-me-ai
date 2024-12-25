import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LandingPage } from './components/landing/LandingPage';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { StoryEditor } from './components/story/StoryEditor';
import { Dashboard } from './components/dashboard/Dashboard';

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <OfflineIndicator />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/story/new" element={<StoryEditor />} />
            <Route path="/story/:id" element={<StoryEditor />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}
export default App;
