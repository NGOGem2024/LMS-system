import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  CalendarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import { 
  PageLoading, 
  AssignmentListSkeleton,
  TableSkeleton 
} from '../ui/LoadingComponents'

interface Assignment {
  _id: string
  title: string
  description: string
  dueDate: string
  course: {
    _id: string
    title: string
  }
  totalPoints: number
  status: 'draft' | 'published' | 'archived'
  submissionStatus?: 'pending' | 'overdue' | 'submitted' | 'late' | 'graded' | 'passed' | 'failed' | 'resubmit' | 'missed'
}

interface Course {
  _id: string
  title: string
}

interface CoursesResponse {
  courses: Course[]
  totalRecords: number
}

interface AssignmentsResponse {
  assignments: Assignment[]
  totalRecords: number
}

const Assignments = () => {
  const { user, token, tenantId, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<boolean>(false)
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [totalAssignments, setTotalAssignments] = useState(0)

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      setError(null)
      setAuthError(false)
      
      try {
        console.log('Fetching assignments...')
        console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'null')
        console.log('Current tenant ID:', tenantId)
        
        if (!token) {
          console.error('No authentication token available');
          setAuthError(true);
          setLoading(false);
          return;
        }
        
        // Set up config with explicit headers
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenantId
          }
        };
        
        // Fetch assignments
        const assignmentsRes = await axios.get<AssignmentsResponse>('/api/assignments', config)
        console.log('Assignments response:', assignmentsRes.data)
        
        if (assignmentsRes.data && assignmentsRes.data.assignments) {
          setAssignments(assignmentsRes.data.assignments)
          setFilteredAssignments(assignmentsRes.data.assignments)
          setTotalAssignments(assignmentsRes.data.totalRecords || assignmentsRes.data.assignments.length)
        } else {
          console.error('Invalid assignments response format:', assignmentsRes.data)
          setError('Invalid response format from server')
        }
        
        // Fetch courses for filter
        try {
          const coursesRes = await axios.get<CoursesResponse>('/api/courses/enrolled', config)
          if (coursesRes.data && coursesRes.data.courses) {
            setCourses(coursesRes.data.courses)
          }
        } catch (courseErr) {
          console.error('Error fetching courses:', courseErr)
          // Don't set error for courses as assignments can still be displayed
        }
      } catch (err: any) {
        console.error('Error fetching assignments:', err)
        
        if (err.response?.status === 401) {
          setAuthError(true);
        } else {
          setError(err.response?.data?.error || 'Failed to load assignments. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchAssignments()
  }, [token, tenantId])

  // Handle authentication error
  const handleRelogin = () => {
    logout();
    navigate('/login');
  }

  useEffect(() => {
    // Filter assignments based on search term, course filter, and tab value
    let filtered = assignments
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by course
    if (courseFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.course._id === courseFilter)
    }
    
    // Filter by tab (submissionStatus)
    if (tabValue === 1) {
      // Pending tab - show pending and overdue
      filtered = filtered.filter(assignment => 
        assignment.submissionStatus === 'pending' || 
        assignment.submissionStatus === 'overdue'
      )
    } else if (tabValue === 2) {
      // Completed tab - show submitted, late, passed, graded
      filtered = filtered.filter(assignment => 
        assignment.submissionStatus === 'submitted' || 
        assignment.submissionStatus === 'late' || 
        assignment.submissionStatus === 'passed' || 
        assignment.submissionStatus === 'graded'
      )
    } else if (tabValue === 3) {
      // Overdue tab - show overdue and missed
      filtered = filtered.filter(assignment => 
        assignment.submissionStatus === 'overdue' || 
        assignment.submissionStatus === 'missed'
      )
    }
    
    setFilteredAssignments(filtered)
  }, [searchTerm, courseFilter, tabValue, assignments])

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue)
  }

  const handleCourseFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCourseFilter(event.target.value)
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'graded':
      case 'passed':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
            <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
            {status === 'passed' ? 'Passed' : (status === 'graded' ? 'Graded' : 'Submitted')}
          </div>
        )
      case 'failed':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
            <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1.5" />
            Failed
          </div>
        )
      case 'resubmit':
      case 'late':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1.5" />
            {status === 'resubmit' ? 'Needs Revision' : 'Late'}
          </div>
        )
      case 'overdue':
      case 'missed':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1.5" />
            {status === 'overdue' ? 'Overdue' : 'Missed'}
          </div>
        )
      case 'pending':
      default:
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
            <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
            Pending
          </div>
        )
    }
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <ExclamationCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
        <p className="text-gray-400 text-center mb-4">
          Your session has expired or you are not authorized to access this page.
        </p>
        <button 
          onClick={handleRelogin}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
        >
          Log In Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <PageLoading />
        <div className="flex items-center mb-6">
          <ClipboardDocumentIcon className="h-8 w-8 text-white opacity-50 mr-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-white opacity-50">
            Assignments
          </h1>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg mb-6">
          <div className="flex">
            {['All', 'Pending', 'Completed', 'Overdue'].map((tab, index) => (
              <div key={tab} className={`flex-1 text-center py-3 ${index === 0 ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>
                {tab}
              </div>
            ))}
          </div>
        </div>
        <TableSkeleton rows={5} cols={3} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ClipboardDocumentIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Assignments
          </h1>
        </div>
        
        {user && (user.role === 'instructor' || user.role === 'admin') && (
          <RouterLink
            to="/assignments/create"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Assignment
          </RouterLink>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg mb-6">
        <div className="flex flex-wrap">
          {['All', 'Pending', 'Completed', 'Overdue'].map((tab, index) => (
            <button 
              key={tab}
              onClick={() => handleTabChange(index)}
              className={`
                flex-1 min-w-[120px] py-3 px-4 text-center transition-all
                ${tabValue === index 
                  ? 'text-blue-500 border-b-2 border-blue-500 font-medium' 
                  : 'text-gray-400 hover:text-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search assignments by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
        </div>
        
        <div>
          <select
            value={courseFilter}
            onChange={handleCourseFilterChange}
            className="block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id} className="bg-[#1e2736] text-white">
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 text-center">
          <ClipboardDocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No assignments found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <div 
              key={assignment._id} 
              className="group bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/10 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  {getStatusChip(assignment.submissionStatus || 'pending')}
                  <div className="flex items-center text-gray-400 text-sm">
                    <CalendarIcon className="h-4 w-4 mr-1.5" />
                    {new Date(assignment.dueDate).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {assignment.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {assignment.description}
                </p>

                <div className="flex items-center text-sm text-gray-400 mb-4">
                  <AcademicCapIcon className="h-4 w-4 mr-1.5" />
                  {assignment.course.title}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-white">
                    {assignment.totalPoints} Points
                  </div>
                  
                  <div className="flex gap-2">
                    <RouterLink 
                      to={`/assignments/${assignment._id}`}
                      className="px-3 py-1.5 text-sm border border-white/10 text-white rounded-md hover:bg-white/5 transition-colors"
                    >
                      View Details
                    </RouterLink>
                    
                    {assignment.submissionStatus === 'pending' && user?.role === 'student' && (
                      <RouterLink 
                        to={`/assignments/${assignment._id}/submit`}
                        className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
                      >
                        Submit
                      </RouterLink>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Assignments 