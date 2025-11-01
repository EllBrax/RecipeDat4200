import { Routes as RRDRoutes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RootLayout from "../layouts/RootLayout";
import Profile from "../pages/Profile";
import Home from "../pages/Home";
import About from "../pages/About";
import Cookbook from "../pages/Cookbook";
import Recents from "../pages/Recents";
import TheKitchen from "../pages/TheKitchen";
import Login from "../pages/Login";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <RRDRoutes>
      <Route path="/login" element={<Login />} />
      <Route element={<RootLayout />}>
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Home /> : <Navigate to="/login" replace />
          } 
        />
        <Route path="/about" element={<About />} />
        <Route 
          path="/cookbook" 
          element={
            <ProtectedRoute>
              <Cookbook />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recents" 
          element={
            <ProtectedRoute>
              <Recents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/thekitchen" 
          element={
            <ProtectedRoute>
              <TheKitchen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Route>
    </RRDRoutes>
  );
}
