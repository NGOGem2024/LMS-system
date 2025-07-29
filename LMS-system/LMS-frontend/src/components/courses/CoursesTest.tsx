import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'

interface Course {
  _id: string
  title: string
  description: string
  slug: string
  price: number
  status: string
  isPublic: boolean
  iconName?: string
  progress?: number
  tenantId: string
  createdAt: string
  updatedAt: string
}

interface Module {
  _id: string
  title: string
  description: string
  duration: string
  courseId: {
    _id: string
    title: string
    description: string
    calculatedProgress: number
    id: string
  }
  isCompleted: boolean
  videoUrl: string
  difficulty: string
  rating: number
  enrolledUsers: number
  tenantId: string
  createdAt: string
  updatedAt: string
  id: string
}

interface CoursesResponse {
  success: boolean
  data: Course[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
  }
}

interface ModulesResponse {
  success: boolean
  count: number
  data: Module[]
}

const Courses = ({ darkMode }: { darkMode: boolean }) => {
  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-white/5 backdrop-blur-sm' : 'bg-white shadow-sm',
    cardHover: darkMode ? 'bg-white/5 backdrop-blur-sm' : 'bg-white shadow-lg',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    textAccent: darkMode ? 'text-blue-400' : 'text-blue-600',
    hoverBg: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    buttonText: darkMode ? 'text-white' : 'text-gray-900',
    skeletonBg: darkMode ? 'bg-white/10' : 'bg-gray-200',
    inputBg: darkMode ? 'bg-gray-700' : 'bg-white',
    input: darkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: darkMode
      ? 'border-white/10 text-white hover:bg-white/5'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50',
    dialogBg: darkMode ? 'bg-gray-800' : 'bg-white',
    dialogBorder: darkMode ? 'border-gray-700' : 'border-gray-200',
    overlay: darkMode ? 'bg-black/50' : 'bg-gray-900/50',
    gradientBg: darkMode 
      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
      : 'bg-gradient-to-r from-blue-100 to-purple-100',
    notification: {
      success: darkMode 
        ? 'bg-green-500/10 border-green-500/20 text-green-400'
        : 'bg-green-50 border-green-200 text-green-700',
      error: darkMode 
        ? 'bg-red-500/10 border-red-500/20 text-red-400'
        : 'bg-red-50 border-red-200 text-red-700',
      info: darkMode 
        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        : 'bg-blue-50 border-blue-200 text-blue-700'
    }
  };

  const { user } = useContext(AuthContext)
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [sortByLevel, setSortByLevel] = useState(false)
  
  // Module related states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [modulesError, setModulesError] = useState<string | null>(null)
  const [openModulesDialog, setOpenModulesDialog] = useState(false)
  const [openAddModuleDialog, setOpenAddModuleDialog] = useState(false)
  const [openEditModuleDialog, setOpenEditModuleDialog] = useState(false)
  const [addingModule, setAddingModule] = useState(false)
  const [editingModule, setEditingModule] = useState(false)
  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null)
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null)
  const [deletingModule, setDeletingModule] = useState(false)
  
  // Delete and Update states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [editing, setEditing] = useState(false)
  
  // Success/error notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })
  
  const navigate = useNavigate()
  
  // New module form state
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    duration: '',
    difficulty: 'Beginner',
    videoUrl: '',
    rating: 4.5
  })

  const coursesPerPage = 9

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get<CoursesResponse>('/api/ngo-lms/courses', {
          timeout: 10000
        })
        
        if (res.data.success) {
          const { data: courses, pagination } = res.data
          
          setCourses(courses)
          setFilteredCourses(courses)
          setTotalRecords(pagination.totalCount)
          setTotalPages(pagination.totalPages)
          setPage(pagination.currentPage)
        } else {
          setError('Failed to load courses. Please try again later.')
        }
      } catch (err: any) {
        console.error('Failed to load courses:', err)
        if (err.response) {
          if (err.response.status === 503) {
            setError('The server is temporarily unavailable. Please try again in a moment.')
          } else if (err.response.status === 401) {
            setError('Your session has expired. Please log in again.')
          } else {
            setError(err.response.data?.error || 'Failed to load courses. Please try again later.')
          }
        } else if (err.request) {
          setError('No response from server. Please check your connection.')
        } else {
          setError('Failed to load courses. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
    
    const fromCreateCourse = window.location.search.includes('newCourse=true')
    if (fromCreateCourse) {
      const retryTimer = setTimeout(() => {
        fetchCourses()
      }, 2000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    let results = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.slug && course.slug.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (sortByLevel) {
      results = results.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }

    setFilteredCourses(results)
    setTotalPages(Math.ceil(results.length / coursesPerPage))
    setPage(1)
  }, [searchTerm, courses, sortByLevel])

  const fetchModules = async (courseId: string) => {
    setModulesLoading(true)
    setModulesError(null)
    try {
      const res = await axios.get<ModulesResponse>(
        `http://localhost:2000/api/ngo-lms/courses/${courseId}/modules`
      )
      if (res.data.success) {
        setModules(res.data.data)
      } else {
        setModulesError('Failed to load modules')
      }
    } catch (err: any) {
      console.error('Failed to load modules:', err)
      setModulesError('Failed to load modules. Please try again.')
    } finally {
      setModulesLoading(false)
    }
  }

  const handleViewModules = (course: Course) => {
    setSelectedCourse(course)
    fetchModules(course._id)
    setOpenModulesDialog(true)
  }

  const handleAddModule = () => {
    setOpenAddModuleDialog(true)
  }

  const handleAddModuleSubmit = async () => {
    if (!selectedCourse) return
    
    setAddingModule(true)
    
    try {
      const modulePayload = {
        title: newModule.title,
        description: newModule.description,
        duration: parseInt(newModule.duration),
        videoUrl: newModule.videoUrl,
        difficulty: newModule.difficulty,
        rating: newModule.rating
      }
      
      const res = await axios.post(
        `http://localhost:2000/api/ngo-lms/courses/${selectedCourse._id}/modules`,
        modulePayload
      )
      
      if (res.data.success) {
        setNotification({
          open: true,
          message: 'Module added successfully!',
          type: 'success'
        })
        
        fetchModules(selectedCourse._id)
        setOpenAddModuleDialog(false)
        setNewModule({
          title: '',
          description: '',
          duration: '',
          difficulty: 'Beginner',
          videoUrl: '',
          rating: 4.5
        })
      } else {
        throw new Error(res.data.message || 'Failed to add module')
      }
    } catch (err: any) {
      console.error('Failed to add module:', err)
      
      let errorMessage = 'Failed to add module. Please try again.'
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        type: 'error'
      })
      
      setModulesError(errorMessage)
    } finally {
      setAddingModule(false)
    }
  }

  const handleEditModule = (module: Module) => {
    setModuleToEdit(module)
    setNewModule({
      title: module.title,
      description: module.description,
      duration: module.duration.toString(),
      difficulty: module.difficulty,
      videoUrl: module.videoUrl,
      rating: module.rating
    })
    setOpenEditModuleDialog(true)
  }

  const handleUpdateModule = async () => {
    if (!moduleToEdit || !selectedCourse) return
    
    setEditingModule(true)
    
    try {
      const modulePayload = {
        title: newModule.title,
        description: newModule.description,
        duration: parseInt(newModule.duration),
        videoUrl: newModule.videoUrl,
        difficulty: newModule.difficulty,
        rating: newModule.rating
      }
      
      const res = await axios.put(
        `http://localhost:2000/api/ngo-lms/courses/${selectedCourse._id}/modules/${moduleToEdit._id}`,
        modulePayload
      )
      
      if (res.data.success) {
        setNotification({
          open: true,
          message: 'Module updated successfully!',
          type: 'success'
        })
        
        fetchModules(selectedCourse._id)
        setOpenEditModuleDialog(false)
        setModuleToEdit(null)
      } else {
        throw new Error(res.data.message || 'Failed to update module')
      }
    } catch (err: any) {
      console.error('Failed to update module:', err)
      setNotification({
        open: true,
        message: err.response?.data?.message || 'Failed to update module',
        type: 'error'
      })
    } finally {
      setEditingModule(false)
    }
  }

  const handleDeleteModule = (module: Module) => {
    setModuleToDelete(module)
  }

  const confirmDeleteModule = async () => {
    if (!moduleToDelete || !selectedCourse) return
    
    setDeletingModule(true)
    try {
      const res = await axios.delete(
        `http://localhost:2000/api/ngo-lms/courses/${selectedCourse._id}/modules/${moduleToDelete._id}`
      )
      
      if (res.data.success) {
        setNotification({
          open: true,
          message: 'Module deleted successfully!',
          type: 'success'
        })
        
        fetchModules(selectedCourse._id)
      } else {
        throw new Error(res.data.message || 'Failed to delete module')
      }
    } catch (err: any) {
      console.error('Failed to delete module:', err)
      setNotification({
        open: true,
        message: err.response?.data?.message || 'Failed to delete module',
        type: 'error'
      })
    } finally {
      setDeletingModule(false)
      setModuleToDelete(null)
    }
  }

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course)
    setOpenDeleteDialog(true)
  }

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return
    
    setDeleting(true)
    try {
      const response = await axios.delete(
        `http://localhost:2000/api/ngo-lms/courses/${courseToDelete._id}`
      )
      
      if (response.data.success) {
        setNotification({
          open: true,
          message: 'Course deleted successfully!',
          type: 'success'
        })
        setCourses(courses.filter(course => course._id !== courseToDelete._id))
        setFilteredCourses(filteredCourses.filter(course => course._id !== courseToDelete._id))
      }
    } catch (err: any) {
      console.error('Failed to delete course:', err)
      setNotification({
        open: true,
        message: 'Failed to delete course. Please try again.',
        type: 'error'
      })
    } finally {
      setDeleting(false)
      setOpenDeleteDialog(false)
      setCourseToDelete(null)
    }
  }

  const handleEditCourse = (course: Course) => {
    setCourseToEdit(course)
    navigate(`/coursestest/update/${course._id}`)
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  const handleEnroll = async (courseId: string) => {
    try {
      await axios.post(`/api/ngo-lms/courses/${courseId}/enroll`)
      
      setCourses(courses.map(course => 
        course._id === courseId 
          ? { ...course, progress: 0 }
          : course
      ))
    } catch (err: any) {
      setError('Failed to enroll in course. Please try again.')
      console.error(err)
    }
  }

  const handlePageChange = (value: number) => {
    setPage(value)
  }

  const handleFilterToggle = () => {
    setSortByLevel(!sortByLevel)
  }

  const paginatedCourses = filteredCourses.slice(
    (page - 1) * coursesPerPage,
    page * coursesPerPage
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Validation for add module form
  const isModuleFormValid = () => {
    return newModule.title.trim() && 
           newModule.description.trim() && 
           newModule.duration.trim() && 
           newModule.videoUrl.trim() &&
           !isNaN(parseInt(newModule.duration)) &&
           parseInt(newModule.duration) > 0
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text}`}>Course Catalog</h1>
              <p className={themeClasses.textMuted}>{totalRecords} courses available</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className={`relative flex-1 md:w-64 ${themeClasses.inputBg} rounded-lg`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className={`h-5 w-5 ${themeClasses.textMuted}`} />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg border ${themeClasses.input}`}
              />
            </div>
            <button
              onClick={handleFilterToggle}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${themeClasses.button}`}
            >
              <ArrowsUpDownIcon className="h-5 w-5" />
              <span>Sort</span>
            </button>
          </div>
        </div>

        {/* Filter Status */}
        {sortByLevel && (
          <div className={`mb-6 border rounded-lg p-4 flex items-center gap-2 ${themeClasses.notification.info}`}>
            <ArrowsUpDownIcon className="h-5 w-5" />
            <span>Courses sorted by creation date (oldest first)</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className={`mb-6 border rounded-lg p-4 flex justify-between items-center ${themeClasses.notification.error}`}>
            <div className="flex items-center gap-2">
              <span>{error}</span>
            </div>
            <button 
              className={`hover:opacity-70 ${themeClasses.text}`}
              onClick={() => {
                setLoading(true)
                setError(null)
                setTimeout(() => {
                  const fetchCourses = async () => {
                    try {
                      const res = await axios.get<CoursesResponse>('/api/ngo-lms/courses', {
                        timeout: 15000
                      })
                      if (res.data.success) {
                        setCourses(res.data.data)
                        setFilteredCourses(res.data.data)
                        setTotalRecords(res.data.pagination.totalCount)
                        setTotalPages(res.data.pagination.totalPages)
                        setPage(res.data.pagination.currentPage)
                      }
                    } catch (err: any) {
                      console.error('Retry failed:', err)
                      setError('Retry failed. Please try again later.')
                    } finally {
                      setLoading(false)
                    }
                  }
                  fetchCourses()
                }, 1000)
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${themeClasses.cardBg} rounded-lg overflow-hidden animate-pulse border ${themeClasses.border}`}>
                <div className={`h-48 ${themeClasses.skeletonBg}`}></div>
                <div className="p-6 space-y-4">
                  <div className={`h-6 ${themeClasses.skeletonBg} rounded w-3/4`}></div>
                  <div className={`h-4 ${themeClasses.skeletonBg} rounded w-full`}></div>
                  <div className={`h-4 ${themeClasses.skeletonBg} rounded w-5/6`}></div>
                  <div className={`h-4 ${themeClasses.skeletonBg} rounded w-2/3`}></div>
                  <div className={`h-10 ${themeClasses.skeletonBg} rounded mt-6`}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <div className={`${themeClasses.cardBg} rounded-xl p-12 text-center border border-dashed ${themeClasses.border}`}>
            <AcademicCapIcon className={`h-16 w-16 mx-auto mb-4 ${themeClasses.textMuted}`} />
            <h3 className={`text-xl font-medium mb-2 ${themeClasses.text}`}>
              No courses found
            </h3>
            <p className={`mb-6 ${themeClasses.textMuted}`}>
              {searchTerm ? 'Try adjusting your search query' : 'There are currently no courses available'}
            </p>
            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <Link
                to="/coursestest/add"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Course
              </Link>
            )}
          </div>
        )}

        {/* Course Grid */}
        {!loading && filteredCourses.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCourses.map((course) => (
                <div 
                  key={course._id}
                  className={`${themeClasses.cardBg} rounded-lg overflow-hidden border ${themeClasses.border} transition-all hover:shadow-lg hover:-translate-y-1`}
                >
                  {/* Course Image/Icon Placeholder */}
                  <div className={`h-48 ${themeClasses.gradientBg} flex items-center justify-center`}>
                    <AcademicCapIcon className={`h-16 w-16 opacity-50 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  
                  {/* Course Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-xl font-bold line-clamp-2 ${themeClasses.text}`}>{course.title}</h3>
                      {user && (user.role === 'instructor' || user.role === 'admin') && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditCourse(course)}
                            className={`p-1 rounded-md transition-colors ${themeClasses.hoverBg}`}
                          >
                            <PencilIcon className={`h-5 w-5 ${themeClasses.textAccent}`} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course)}
                            className={`p-1 rounded-md transition-colors ${themeClasses.hoverBg}`}
                          >
                            <TrashIcon className="h-5 w-5 text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className={`line-clamp-3 mb-4 ${themeClasses.textMuted}`}>{course.description}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-sm ${themeClasses.textMuted}`}>
                        Created: {formatDate(course.createdAt)}
                      </span>
                      <span className={`text-lg font-bold ${
                        course.price !== undefined ? themeClasses.textAccent : 'text-green-500'
                      }`}>
                        {course.price !== undefined ? `$${course.price.toFixed(2)}` : 'Free'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={course.progress ? 
                          () => window.location.href = `/courses/${course.slug || course._id}` : 
                          () => handleEnroll(course._id)
                        }
                        className={`flex-1 py-2 px-4 rounded-md transition-all ${
                          course.progress 
                            ? `border ${themeClasses.textAccent} ${themeClasses.hoverBg}`
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                        }`}
                      >
                        {course.progress ? 'Continue' : 'Start Course'}
                      </button>
                      
                      {user && (user.role === 'instructor' || user.role === 'admin') && (
                        <button
                          onClick={() => handleViewModules(course)}
                          className={`p-2 border rounded-md transition-colors ${themeClasses.border} ${themeClasses.hoverBg}`}
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        page === pageNum
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : `${themeClasses.cardBg} ${themeClasses.textMuted} ${themeClasses.hoverBg}`
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modules Dialog */}
      {openModulesDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden border ${themeClasses.dialogBorder}`}>
            {/* Header */}
            <div className={`p-6 border-b flex-shrink-0 ${themeClasses.dialogBorder}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
                  {selectedCourse?.title} - Modules
                </h2>
                <button 
                  onClick={() => setOpenModulesDialog(false)}
                  className={`p-2 rounded-md transition-colors ${themeClasses.hoverBg}`}
                >
                  <XMarkIcon className={`h-6 w-6 ${themeClasses.textMuted} hover:${themeClasses.text}`} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {modulesLoading ? (
                <div className="flex justify-center py-8">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : modulesError ? (
                <div className={`border rounded-lg p-4 mb-4 ${themeClasses.notification.error}`}>
                  {modulesError}
                </div>
              ) : modules.length === 0 ? (
                <div className={`text-center py-8 ${themeClasses.textMuted}`}>
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>No modules available for this course yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div 
                      key={module._id}
                      className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`font-medium ${themeClasses.text}`}>{module.title}</h3>
                          <p className={`text-sm mt-1 ${themeClasses.textMuted}`}>{module.description}</p>
                        </div>
                        {user && (user.role === 'instructor' || user.role === 'admin') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditModule(module)}
                              className={`p-1 rounded-md ${themeClasses.hoverBg}`}
                            >
                              <PencilIcon className={`h-5 w-5 ${themeClasses.textAccent}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteModule(module)}
                              className={`p-1 rounded-md ${themeClasses.hoverBg}`}
                            >
                              <TrashIcon className="h-5 w-5 text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-4 gap-4">
                        {module.videoUrl && (
                          <div className={`flex items-center text-sm ${themeClasses.textMuted}`}>
                            <VideoCameraIcon className="h-4 w-4 mr-1" />
                            <span>Video</span>
                          </div>
                        )}
                        <div className={`text-sm ${themeClasses.textMuted}`}>
                          Duration: {module.duration} mins
                        </div>
                        <div className={`text-sm ${themeClasses.textMuted}`}>
                          Difficulty: {module.difficulty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className={`p-4 border-t flex justify-end gap-3 ${themeClasses.dialogBorder}`}>
              {user && (user.role === 'instructor' || user.role === 'admin') && (
                <button
                  onClick={handleAddModule}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all`}
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Module
                </button>
              )}
              <button
                onClick={() => setOpenModulesDialog(false)}
                className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Dialog */}
      {openAddModuleDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-md overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-6 ${themeClasses.text}`}>
                Add New Module
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={newModule.title}
                    onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Module title"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Description
                  </label>
                  <textarea
                    value={newModule.description}
                    onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Module description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newModule.duration}
                      onChange={(e) => setNewModule({...newModule, duration: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder="30"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Difficulty
                    </label>
                    <select
                      value={newModule.difficulty}
                      onChange={(e) => setNewModule({...newModule, difficulty: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={newModule.videoUrl}
                    onChange={(e) => setNewModule({...newModule, videoUrl: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setOpenAddModuleDialog(false)}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddModuleSubmit}
                  disabled={!isModuleFormValid() || addingModule}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all ${
                    (!isModuleFormValid() || addingModule) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {addingModule ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Module'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Dialog */}
      {openEditModuleDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-md overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-6 ${themeClasses.text}`}>
                Edit Module
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={newModule.title}
                    onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Module title"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Description
                  </label>
                  <textarea
                    value={newModule.description}
                    onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Module description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newModule.duration}
                      onChange={(e) => setNewModule({...newModule, duration: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder="30"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Difficulty
                    </label>
                    <select
                      value={newModule.difficulty}
                      onChange={(e) => setNewModule({...newModule, difficulty: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={newModule.videoUrl}
                    onChange={(e) => setNewModule({...newModule, videoUrl: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setOpenEditModuleDialog(false)}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateModule}
                  disabled={!isModuleFormValid() || editingModule}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all ${
                    (!isModuleFormValid() || editingModule) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {editingModule ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Module'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Module Confirmation */}
      {moduleToDelete && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-md overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-4 ${themeClasses.text}`}>
                Delete Module
              </h2>
              <p className={`mb-6 ${themeClasses.textMuted}`}>
                Are you sure you want to delete the module "{moduleToDelete.title}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModuleToDelete(null)}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteModule}
                  disabled={deletingModule}
                  className={`px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all ${
                    deletingModule ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deletingModule ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Module'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation */}
      {openDeleteDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-md overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-4 ${themeClasses.text}`}>
                Delete Course
              </h2>
              <p className={`mb-6 ${themeClasses.textMuted}`}>
                Are you sure you want to delete the course "{courseToDelete?.title}"? This will also delete all associated modules and cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpenDeleteDialog(false)}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCourse}
                  disabled={deleting}
                  className={`px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all ${
                    deleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deleting ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Course'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.open && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg border flex items-center gap-3 ${themeClasses.notification[notification.type]}`}>
          {notification.type === 'success' && (
            <CheckCircleIcon className="h-6 w-6" />
          )}
          <span>{notification.message}</span>
          <button 
            onClick={handleCloseNotification}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default Courses