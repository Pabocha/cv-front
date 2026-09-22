import { createBrowserRouter, Outlet } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PricingPage from './pages/PricingPage'
import CommanderPage from './pages/CommanderPage'
import GuestCreatePage from './pages/GuestCreatePage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './features/profile/ProfilePage'
import CvListPage from './features/cv/CvListPage'
import CvCreatePage from './features/cv/CvCreatePage'
import CvViewPage from './features/cv/CvViewPage'
import CvEditPage from './features/cv/CvEditPage'
import AtsPage from './features/ats/AtsPage'
import AdaptPage from './features/adapt/AdaptPage'
import TemplatesPage from './features/templates/TemplatesPage'
import LetterPage from './features/letters/LetterPage'
import ProtectedRoute from './components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        index: true,
        element: (
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
        ),
      },
      {
        path: 'creer-cv',
        element: (
          <PublicLayout>
            <GuestCreatePage />
          </PublicLayout>
        ),
      },
      {
        path: 'pricing',
        element: (
          <PublicLayout>
            <PricingPage />
          </PublicLayout>
        ),
      },
      {
        path: 'commander',
        element: (
          <PublicLayout>
            <CommanderPage />
          </PublicLayout>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <ProfilePage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
path: 'cvs',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <CvListPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: 'templates',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <TemplatesPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
      {
        path: 'cv/new',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <CvCreatePage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: 'cv/:id',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <CvViewPage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: 'cv/:id/edit',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <CvEditPage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: 'cv/:id/ats',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <AtsPage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: 'cv/:id/adapt',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <AdaptPage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: 'cv/:id/lettre',
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <LetterPage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
    ],
  },
])