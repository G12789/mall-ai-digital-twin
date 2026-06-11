import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/Auth/LoginPage'
import RegisterPage from '../pages/Auth/RegisterPage'
import MallListPage from '../pages/MallManagement/MallListPage'
import MallDetailPage from '../pages/MallManagement/MallDetailPage'
import MallCreatePage from '../pages/MallManagement/MallCreatePage'
import MallEditPage from '../pages/MallManagement/MallEditPage'
import FloorDetailPage from '../pages/MallManagement/FloorDetailPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'

// Lazy-loaded heavy pages (Three.js, etc.)
const TwinViewerPage = lazy(() => import('../pages/TwinViewer/TwinViewerPage'))
const UnitEditorPage = lazy(() => import('../pages/UnitEditor/UnitEditorPage'))
const CopilotPage = lazy(() => import('../pages/Copilot/CopilotPage'))
const KnowledgeListPage = lazy(() => import('../pages/Knowledge/KnowledgeListPage'))
const AnalyticsDashboardPage = lazy(() => import('../pages/Analytics/DashboardPage'))

// Eager-loaded lightweight pages
import UnitListPage from '../pages/PropertyManagement/UnitListPage'
import TenantListPage from '../pages/PropertyManagement/TenantListPage'
import LeaseListPage from '../pages/PropertyManagement/LeaseListPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/malls', element: <MallListPage /> },
      { path: '/malls/new', element: <MallCreatePage /> },
      { path: '/malls/:id', element: <MallDetailPage /> },
      { path: '/malls/:id/edit', element: <MallEditPage /> },
      { path: '/malls/:id/twin', element: <TwinViewerPage /> },
      { path: '/malls/:id/editor', element: <UnitEditorPage /> },
      { path: '/malls/:id/floors/:floorId', element: <FloorDetailPage /> },
      { path: '/units', element: <UnitListPage /> },
      { path: '/tenants', element: <TenantListPage /> },
      { path: '/leases', element: <LeaseListPage /> },
      { path: '/copilot', element: <CopilotPage /> },
      { path: '/knowledge', element: <KnowledgeListPage /> },
      { path: '/analytics', element: <AnalyticsDashboardPage /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
