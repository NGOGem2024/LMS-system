import { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'

interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalAssignments: number
  totalInstitutions: number
  recentUsers: RecentUser[]
  recentCourses: RecentCourse[]
}

interface RecentUser {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface RecentCourse {
  _id: string
  title: string
  instructor: {
    _id: string
    name: string
  }
  enrolledCount: number
  createdAt: string
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get('/api/admin/stats')
        setStats(res.data)
      } catch (err: any) {
        setError('Failed to load admin statistics. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAdminStats()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full h-1 bg-primary-main animate-pulse"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-error-light text-error-dark border border-error-main rounded-md p-4">
          Failed to load admin statistics. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <ChartBarIcon className="h-8 w-8 text-primary-main mr-2" />
        <h1 className="text-2xl md:text-3xl font-bold">
          Admin Dashboard
        </h1>
      </div>
      
      {error && (
        <div className="bg-error-light text-error-dark border border-error-main rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:scale-[1.03] transition-transform duration-300">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <UserGroupIcon className="h-6 w-6 text-primary-main mr-2" />
              <h2 className="text-lg font-semibold">
                Users
              </h2>
            </div>
            <p className="text-3xl font-bold text-center my-4">
              {stats.totalUsers}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
            <RouterLink 
              to="/admin/users"
              className="block w-full text-center text-primary-main hover:text-primary-dark"
            >
              Manage Users
            </RouterLink>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:scale-[1.03] transition-transform duration-300">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <AcademicCapIcon className="h-6 w-6 text-primary-main mr-2" />
              <h2 className="text-lg font-semibold">
                Courses
              </h2>
            </div>
            <p className="text-3xl font-bold text-center my-4">
              {stats.totalCourses}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
            <RouterLink 
              to="/admin/courses"
              className="block w-full text-center text-primary-main hover:text-primary-dark"
            >
              Manage Courses
            </RouterLink>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:scale-[1.03] transition-transform duration-300">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <ClipboardDocumentIcon className="h-6 w-6 text-primary-main mr-2" />
              <h2 className="text-lg font-semibold">
                Assignments
              </h2>
            </div>
            <p className="text-3xl font-bold text-center my-4">
              {stats.totalAssignments}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
            <RouterLink 
              to="/admin/assignments"
              className="block w-full text-center text-primary-main hover:text-primary-dark"
            >
              Manage Assignments
            </RouterLink>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:scale-[1.03] transition-transform duration-300">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <BuildingOfficeIcon className="h-6 w-6 text-primary-main mr-2" />
              <h2 className="text-lg font-semibold">
                Institutions
              </h2>
            </div>
            <p className="text-3xl font-bold text-center my-4">
              {stats.totalInstitutions}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
            <RouterLink 
              to="/admin/institutions"
              className="block w-full text-center text-primary-main hover:text-primary-dark"
            >
              Manage Institutions
            </RouterLink>
          </div>
        </div>
      </div>
      
      {/* Recent Users and Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-6 w-6 text-primary-main mr-2" />
            <h2 className="text-xl font-semibold">
              Recent Users
            </h2>
          </div>
          <hr className="my-3 border-gray-200 dark:border-gray-700" />
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.recentUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{user.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{user.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{user.role}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <RouterLink 
              to="/admin/users" 
              className="text-sm text-primary-main hover:text-primary-dark"
            >
              View All Users
            </RouterLink>
          </div>
        </div>
        
        {/* Recent Courses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-6 w-6 text-primary-main mr-2" />
            <h2 className="text-xl font-semibold">
              Recent Courses
            </h2>
          </div>
          <hr className="my-3 border-gray-200 dark:border-gray-700" />
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Instructor</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Enrolled</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.recentCourses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{course.title}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{course.instructor.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{course.enrolledCount}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(course.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <RouterLink 
              to="/admin/courses" 
              className="text-sm text-primary-main hover:text-primary-dark"
            >
              View All Courses
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 