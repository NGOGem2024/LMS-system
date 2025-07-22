import { useState, useEffect, useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
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
import CourseDetails from './components/courses/CourseDetails'
import AddCourse from './components/courses/AddCourse'
import CoursesTest from './components/courses/CoursesTest'
import AddCourseTest from './components/courses/AddCourseTest'
import UpdateCourse from './components/courses/UpdateCourse'
// Assignment components
import Assignments from './components/assignments/Assignments'
import AssignmentDetails from './components/assignments/AssignmentDetails'
import SubmitAssignment from './components/assignments/SubmitAssignment'
import CreateAssignment from './components/assignments/CreateAssignment'

// Quiz components
import Quizzes from './components/quizzes/Quizzes'
import QuizAttempt from './components/quizzes/QuizAttempt'

// User components
import Profile from './components/user/Profile'

// Admin components
import AdminDashboard from './components/admin/AdminDashboard'
import UserManagement from './components/admin/UserManagement'
import CourseManagement from './components/admin/CourseManagement'

// Context
import AuthContext, { AuthProvider } from './context/AuthContext'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
})

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#e91e63',
    },
  },
})

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
    setDarkMode(!darkMode)
    localStorage.setItem('darkMode', String(!darkMode))
  }

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
  }, [])

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <LoadingProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              
              <Route path="courses" element={<Courses />} />
              <Route path="courses/add" element={<AddCourse />} />
              <Route path="courses/:id" element={<CourseDetails />} />

              {/* Test Course */}
              <Route path="coursestest" element={<CoursesTest />} />
              <Route path="coursestest/add" element={<AddCourseTest/>} />
              <Route path="coursestest/update/:id" element={<UpdateCourse/>} />

              <Route path="assignments" element={<Assignments />} />
              <Route path="assignments/create" element={<CreateAssignment />} />
              <Route path="assignments/:id" element={<AssignmentDetails />} />
              <Route path="assignments/:id/submit" element={<SubmitAssignment />} />

              <Route path="quizzes" element={<Quizzes />} />
              <Route path="quizzes/:id" element={<QuizAttempt />} />
              <Route path="courses/:courseId/quizzes" element={<Quizzes />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Admin routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<UserManagement />} />
              <Route path="admin/courses" element={<CourseManagement />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 