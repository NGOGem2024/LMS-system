import { useState, useEffect, useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoadingProvider } from './context/LoadingContext'

// Layout components
import Layout from './components/layout/Layout'

// Auth components
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ForgotPassword from './components/auth/ForgotPassword'

// Dashboard components
import Dashboard from './components/dashboard/Dashboard'

// Course components
import Courses from './components/courses/Courses'
import CurriculumForm from './components/courses/CurriculumForm'

// Assignment components
import Assignments from './components/assignments/Assignments'
import AssignmentDetails from './components/assignments/AssignmentDetails'
import SubmitAssignment from './components/assignments/SubmitAssignment'
import CreateAssignment from './components/assignments/CreateAssignment'

// User components
import Profile from './components/user/Profile'

// Admin components
import AdminDashboard from './components/admin/AdminDashboard'
// import UserManagement from './components/admin/UserManagement'
import CourseManagement from './components/admin/CourseManagement'

// Demo component
import TailwindDemo from './components/ui/TailwindDemo'

// Context
import AuthContext, { AuthProvider } from './context/AuthContext'

// Protected Route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext)
  const location = useLocation()
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

function App() {
  const [darkMode, setDarkMode] = useState(false)
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    
    // Toggle dark mode class on document element for Tailwind
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Force a full page style refresh
    document.body.style.backgroundColor = newDarkMode ? '#1f2937' : '#f3f4f6'
  }

  useEffect(() => {
    // Check if dark mode preference exists in localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    
    // Use system preference if no saved preference
    let isDarkMode = false
    if (savedDarkMode === null) {
      // Check system preference
      isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      localStorage.setItem('darkMode', String(isDarkMode))
    } else {
      isDarkMode = savedDarkMode === 'true'
    }
    
    // Set state based on localStorage or system preference
    setDarkMode(isDarkMode)
    
    // Apply dark mode class to document element
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#1f2937'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#f3f4f6'
    }
  }, [])

  // Set body background color directly to match theme
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? '#1f2937' : '#f3f4f6'
  }, [darkMode])

  return (
    <div className={darkMode ? 'dark' : ''}>
    <AuthProvider>
      <LoadingProvider>
          <div className={darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}>
        <Routes>
          {/* Public routes */}
              <Route path="/login" element={
                <div className={darkMode ? 'bg-gray-900 text-white min-h-screen' : 'bg-gray-100 text-gray-900 min-h-screen'}>
                  <Login />
                </div>
              } />
              <Route path="/register" element={
                <div className={darkMode ? 'bg-gray-900 text-white min-h-screen' : 'bg-gray-100 text-gray-900 min-h-screen'}>
                  <Register />
                </div>
              } />
              <Route path="/forgot-password" element={
                <div className={darkMode ? 'bg-gray-900 text-white min-h-screen' : 'bg-gray-100 text-gray-900 min-h-screen'}>
                  <ForgotPassword />
                </div>
              } />
              <Route path="/tailwind-demo" element={
                <div className={darkMode ? 'bg-gray-900 text-white min-h-screen' : 'bg-gray-100 text-gray-900 min-h-screen'}>
                  <TailwindDemo />
                </div>
              } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/curriculum" element={<CurriculumForm />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="assignments/create" element={<CreateAssignment />} />
            <Route path="assignments/:id" element={<AssignmentDetails />} />
            <Route path="assignments/:id/submit" element={<SubmitAssignment />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Admin routes */}
            <Route path="admin" element={<AdminDashboard />} />
            {/* <Route path="admin/users" element={<UserManagement />} /> */}
            <Route path="admin/courses" element={<CourseManagement />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </div>
      </LoadingProvider>
    </AuthProvider>
    </div>
  )
}

export default App 