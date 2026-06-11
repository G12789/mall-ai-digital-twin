import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../shared/hooks/useAuth'
import LoadingSpinner from '../shared/components/ui/LoadingSpinner'

export default function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner tip="加载中..." />
  if (user) return <Navigate to="/malls" replace />

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">商场AI孪生平台</h1>
          <p className="text-gray-500 mt-2">经营管理数字孪生系统</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
