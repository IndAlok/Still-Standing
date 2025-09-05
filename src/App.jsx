import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login/Login";
import SignUpPage from "./pages/Login/signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import Groups from "./pages/Groups/Groups";
import Chat from "./pages/Chat/Chat";
import Settings from "./pages/Settings/Settings";
import LandingPage from "./pages/LandingPage/landing";
import UserProfilePage from "./pages/Profile/ProfilePage";

function App() {
  return (
    <AuthProvider>
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
          {/* <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
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
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
