import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login/Login";
import SignUpPage from "./pages/Login/signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Groups from "./pages/Groups/Groups";
import Chat from "./pages/Chat/Chat";
import Settings from "./pages/Settings/Settings";
import Notifications from "./pages/Notifications/Notifications";
import LandingPage from "./pages/LandingPage/landing";
import InvitationManager from "./components/InvitationManager/InvitationManager";
import Discover from "./pages/Discover/Discover";
import UserProfilePage from "./pages/Profile/ProfilePage";
import TeamBuilder from "./pages/TeamBuilder/TeamBuilder";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<SignUpPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <Discover />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:groupId?"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invitations"
              element={
                <ProtectedRoute>
                  <InvitationManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-builder"
              element={
                <ProtectedRoute>
                  <TeamBuilder />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
          </Routes>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
