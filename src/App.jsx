import React, { useEffect } from 'react'
import { RouterProvider, createBrowserRouter, useNavigate } from 'react-router-dom'
import Home from './Pages/Home';
import { AuthProvider } from './Auth/AuthContext';
import Register from './Components/Auth/Register';
import Verification from './Components/Auth/Verification';
import Subscriptions from './Components/Subscriptions/Subscriptions';
import SignIn from './Components/Auth/Login';
import CreateCompany from './Components/Company/CreateCompany';
import ProtectedRoute from './Components/Routes/ProtectedRoutes';
import RestoreVerification from './Components/Auth/ResetPas';
import Dashboard from './Pages/Dashboard/Dashboard';
import Workspace from './Pages/Dashboard/Workspace/Workspace';
import WelcomeDashboard from './Components/WelcomeDashboard';
import NotificationsPage from './Components/Notifications/NotificationsPage';
import Settings from './Components/Settings/Settings';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import TermsofPolicy from './Components/Auth/TermsofPolicy';
import MembersPage from './Pages/Members';

// New wrapper used in route elements to prevent authenticated users from visiting auth pages


const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/register",
      // RedirectIfAuth removed
      element: <AuthProvider><Register /></AuthProvider>,
    },
    {
      path: "/login",
      element: <AuthProvider><SignIn /></AuthProvider>,
    },
    {
      path: "/verification",
      element: <AuthProvider><Verification /></AuthProvider>,
    },
    {
      path: "/reset-password",
      element: <AuthProvider><RestoreVerification /></AuthProvider>,
    },
    {
      path: "/createcompany",
      element: <AuthProvider><ProtectedRoute element={<CreateCompany />} /></AuthProvider>,
    },
    {
      path: "/subscriptions",
      element: <AuthProvider><ProtectedRoute element={<Subscriptions />} /></AuthProvider>,
    },
    {
      path: "/settings",
      element: <AuthProvider> <ProtectedRoute element={<Settings />} /></AuthProvider>,
    },
    {
      path: "/notifications",
      element: <AuthProvider> <ProtectedRoute element={<NotificationsPage />} /></AuthProvider>,
    },
    {
      path: "/dashboard",
      element: <AuthProvider><ProtectedRoute element={<Dashboard />} /></AuthProvider>,
      children: [
        {
          path: '/dashboard',
          element: <AuthProvider><ProtectedRoute element={<WelcomeDashboard />} /></AuthProvider>
        },
        {
          path: "/dashboard/members",
          element: <AuthProvider> <ProtectedRoute element={<MembersPage />} /></AuthProvider>,
        },
        {
          path: "/dashboard/workspace/:id",
          element: <ProtectedRoute element={<Workspace />} />,
        },
        {
          path: "/dashboard/workspace/:id/:sheetId",
          element: <ProtectedRoute element={<Workspace />} />,
        },
      ]
    },
    {
      path: "/admin",
      element: <AuthProvider><ProtectedRoute element={<AdminDashboard />} /></AuthProvider>,
      // You can add children routes here if needed, similar to dashboard
    },
    {
      path: "/terms",
      element: <TermsofPolicy />,
    },
  ]);
  return (
    <div className="custom-scrollbar">
      <RouterProvider router={router} />
    </div>
  )
}

export default App