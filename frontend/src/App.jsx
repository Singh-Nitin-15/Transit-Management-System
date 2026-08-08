import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// User + shared pages
import Dashboard from './pages/Dashboard';
import BusSchedules from './pages/BusSchedules';
import TrainSchedules from './pages/TrainSchedules';
import BusBookings from './pages/BusBookings';
import TrainBookings from './pages/TrainBookings';

// Admin-only pages
import Buses from './pages/Buses';
import Trains from './pages/Trains';
import BusDrivers from './pages/Drivers';
import TrainDrivers from './pages/TrainDrivers';
import ImportData from './pages/ImportData';
import AdminInvites from './pages/AdminInvites';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes (any logged-in user) */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/bus/schedules" element={
            <ProtectedRoute>
              <AppLayout><BusSchedules /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/bus/bookings" element={
            <ProtectedRoute>
              <AppLayout><BusBookings /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/train/schedules" element={
            <ProtectedRoute>
              <AppLayout><TrainSchedules /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/train/bookings" element={
            <ProtectedRoute>
              <AppLayout><TrainBookings /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin-only routes */}
          <Route path="/admin/buses" element={
            <AdminRoute>
              <AppLayout><Buses /></AppLayout>
            </AdminRoute>
          } />
          <Route path="/admin/trains" element={
            <AdminRoute>
              <AppLayout><Trains /></AppLayout>
            </AdminRoute>
          } />
          <Route path="/admin/bus-drivers" element={
            <AdminRoute>
              <AppLayout><BusDrivers /></AppLayout>
            </AdminRoute>
          } />
          <Route path="/admin/train-drivers" element={
            <AdminRoute>
              <AppLayout><TrainDrivers /></AppLayout>
            </AdminRoute>
          } />
          <Route path="/admin/import" element={
            <AdminRoute>
              <AppLayout><ImportData /></AppLayout>
            </AdminRoute>
          } />
          <Route path="/admin/invites" element={
            <AdminRoute>
              <AppLayout><AdminInvites /></AppLayout>
            </AdminRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
