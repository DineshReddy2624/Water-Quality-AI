import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/common/Layout';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { WaterQualityDashboard } from './pages/dashboard/WaterQualityDashboard';
import { DatasetUpload } from './pages/datasets/DatasetUpload';
import { ManualSampleEntry } from './pages/samples/ManualSampleEntry';
import { WaterSampleManagement } from './pages/samples/WaterSampleManagement';
import { SampleDetail } from './pages/samples/SampleDetail';
import { ParameterAnalysis } from './pages/analysis/ParameterAnalysis';
import { WaterQualityClassification } from './pages/analysis/WaterQualityClassification';
import { ContaminationDetection } from './pages/analysis/ContaminationDetection';
import { AnomalyDetectionPage } from './pages/anomalies/AnomalyDetectionPage';
import { MLPipelinePage } from './pages/analysis/MLPipelinePage';
import { InteractiveMapPage } from './pages/locations/InteractiveMapPage';
import { LocationMonitoring } from './pages/locations/LocationMonitoring';
import { HistoricalAnalysis } from './pages/analysis/HistoricalAnalysis';
import { VisualizationAnalytics } from './pages/analysis/VisualizationAnalytics';
import { AlertManagement } from './pages/alerts/AlertManagement';
import { ReportGeneration } from './pages/reports/ReportGeneration';
import { UserManagement } from './pages/settings/UserManagement';
import { SettingsConfiguration } from './pages/settings/SettingsConfiguration';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        Authenticating AquaSense session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated / Protected routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/quality-dashboard" element={<ProtectedRoute><WaterQualityDashboard /></ProtectedRoute>} />
            <Route path="/samples/new" element={<ProtectedRoute><ManualSampleEntry /></ProtectedRoute>} />
            <Route path="/datasets/upload" element={<ProtectedRoute><DatasetUpload /></ProtectedRoute>} />
            <Route path="/samples" element={<ProtectedRoute><WaterSampleManagement /></ProtectedRoute>} />
            <Route path="/samples/:id" element={<ProtectedRoute><SampleDetail /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><ParameterAnalysis /></ProtectedRoute>} />
            <Route path="/classification" element={<ProtectedRoute><WaterQualityClassification /></ProtectedRoute>} />
            <Route path="/contamination" element={<ProtectedRoute><ContaminationDetection /></ProtectedRoute>} />
            <Route path="/anomalies" element={<ProtectedRoute><AnomalyDetectionPage /></ProtectedRoute>} />
            <Route path="/ml" element={<ProtectedRoute><MLPipelinePage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><InteractiveMapPage /></ProtectedRoute>} />
            <Route path="/locations" element={<ProtectedRoute><LocationMonitoring /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoricalAnalysis /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><VisualizationAnalytics /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AlertManagement /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportGeneration /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsConfiguration /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
