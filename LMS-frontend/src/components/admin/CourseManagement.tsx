import { useState, useEffect, FormEvent } from 'react'
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Link as RouterLink } from 'react-router-dom'
import axios from 'axios'

interface Course {
  _id: string
  title: string
  description: string
  category: string
  instructor: {
    _id: string
    name: string
  }
  enrolledCount: number
  createdAt: string
}

interface User {
  _id: string
  name: string
}

interface CourseFormData {
  title: string
  description: string
  category: string
  instructor: string
}

const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Dialog state
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: '',
    instructor: ''
  })
  const [formErrors, setFormErrors] = useState<{
    title?: string
    description?: string
    category?: string
    instructor?: string
  }>({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch courses
        const coursesRes = await axios.get('/api/admin/courses')
        setCourses(coursesRes.data)
        setFilteredCourses(coursesRes.data)
        
        // Fetch instructors for the dropdown
        const instructorsRes = await axios.get('/api/admin/users?role=instructor')
        setInstructors(instructorsRes.data)
      } catch (err: any) {
        setError('Failed to load data. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = courses.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCourses(filtered)
      setPage(0) // Reset to first page when search changes
    } else {
      setFilteredCourses(courses)
    }
  }, [searchTerm, courses])

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  const handleOpenAddDialog = () => {
    window.location.href = '/courses/curriculum';
  };

  const handleOpenEditDialog = (course: Course) => {
    setSelectedCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      instructor: course.instructor._id
    })
    setFormErrors({})
    setOpenEditDialog(true)
  }

  const handleOpenDeleteDialog = (course: Course) => {
    setSelectedCourse(course)
    setOpenDeleteDialog(true)
  }

  const handleCloseDialogs = () => {
    setOpenAddDialog(false)
    setOpenEditDialog(false)
    setOpenDeleteDialog(false)
    setSelectedCourse(null)
  }

  const validateForm = () => {
    const errors: {
      title?: string
      description?: string
      category?: string
      instructor?: string
    } = {}
    let isValid = true

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
      isValid = false
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
      isValid = false
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required'
      isValid = false
    }

    if (!formData.instructor) {
      errors.instructor = 'Instructor is required'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleAddCourse = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setError(null)
    setSuccess(null)
    
    try {
      const res = await axios.post('/api/admin/courses', formData)
      
      // Update courses list
      const instructor = instructors.find(i => i._id === formData.instructor)
      const newCourse = {
        ...res.data,
        instructor: {
          _id: formData.instructor,
          name: instructor ? instructor.name : 'Unknown'
        }
      }
      setCourses([...courses, newCourse])
      
      setSuccess('Course added successfully!')
      handleCloseDialogs()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add course. Please try again.')
      console.error(err)
    }
  }

  const handleEditCourse = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !selectedCourse) {
      return
    }
    
    setError(null)
    setSuccess(null)
    
    try {
      const res = await axios.put(`/api/admin/courses/${selectedCourse._id}`, formData)
      
      // Update courses list
      const instructor = instructors.find(i => i._id === formData.instructor)
      setCourses(courses.map(course => 
        course._id === selectedCourse._id 
          ? { 
              ...course, 
              ...res.data,
              instructor: {
                _id: formData.instructor,
                name: instructor ? instructor.name : 'Unknown'
              }
            } 
          : course
      ))
      
      setSuccess('Course updated successfully!')
      handleCloseDialogs()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update course. Please try again.')
      console.error(err)
    }
  }

  const handleDeleteCourse = async () => {
    if (!selectedCourse) {
      return
    }
    
    setError(null)
    setSuccess(null)
    
    try {
      await axios.delete(`/api/admin/courses/${selectedCourse._id}`)
      
      // Update courses list
      setCourses(courses.filter(course => course._id !== selectedCourse._id))
      
      setSuccess('Course deleted successfully!')
      handleCloseDialogs()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete course. Please try again.')
      console.error(err)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full h-1 bg-primary-main animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <RouterLink
          to="/admin"
          className="flex items-center text-primary-main hover:text-primary-dark"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Back to Dashboard</span>
        </RouterLink>
      </div>
      
      <div className="flex items-center mb-6">
        <AcademicCapIcon className="h-8 w-8 text-primary-main mr-2" />
        <h1 className="text-2xl md:text-3xl font-bold">
          Course Management
        </h1>
      </div>
      
      {error && (
        <div className="bg-error-light text-error-dark border border-error-main rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-success-light text-success-dark border border-success-main rounded-md p-4 mb-6">
          {success}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses by title, description, category or instructor"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <RouterLink
              to="/courses/curriculum"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Course
            </RouterLink>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Instructor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Enrolled</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{course.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-xs rounded-full bg-primary-light text-primary-dark">
                        {course.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{course.instructor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{course.enrolledCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(course.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button 
                        onClick={() => handleOpenEditDialog(course)}
                        className="text-primary-main hover:text-primary-dark p-1 mx-1"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteDialog(course)}
                        className="text-error-main hover:text-error-dark p-1 mx-1"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Rows per page:
            </span>
            <select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              className="ml-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-primary-main focus:border-primary-main"
            >
              {[5, 10, 25].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredCourses.length)} of {filteredCourses.length}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleChangePage(page - 1)}
                disabled={page === 0}
                className="p-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handleChangePage(page + 1)}
                disabled={page >= Math.ceil(filteredCourses.length / rowsPerPage) - 1}
                className="p-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Course Dialog */}
      {openEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Course</h2>
              
              <form onSubmit={handleEditCourse}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className={`block w-full px-3 py-2 border ${
                        formErrors.title ? 'border-error-main' : 'border-gray-300 dark:border-gray-600'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white`}
                      required
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-error-main">{formErrors.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleFormChange}
                      className={`block w-full px-3 py-2 border ${
                        formErrors.description ? 'border-error-main' : 'border-gray-300 dark:border-gray-600'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white`}
                      required
                    ></textarea>
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-error-main">{formErrors.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        className={`block w-full px-3 py-2 border ${
                          formErrors.category ? 'border-error-main' : 'border-gray-300 dark:border-gray-600'
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white`}
                        required
                      />
                      {formErrors.category && (
                        <p className="mt-1 text-sm text-error-main">{formErrors.category}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Instructor *
                      </label>
                      <select
                        id="instructor"
                        name="instructor"
                        value={formData.instructor}
                        onChange={handleSelectChange}
                        className={`block w-full px-3 py-2 border ${
                          formErrors.instructor ? 'border-error-main' : 'border-gray-300 dark:border-gray-600'
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary-main focus:border-primary-main dark:bg-gray-700 dark:text-white`}
                        required
                      >
                        <option value="">Select Instructor</option>
                        {instructors.map((instructor) => (
                          <option key={instructor._id} value={instructor._id}>
                            {instructor.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.instructor && (
                        <p className="mt-1 text-sm text-error-main">{formErrors.instructor}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseDialogs}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-main text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                  >
                    Update Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Course Dialog */}
      {openDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Delete Course</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete the course "{selectedCourse?.title}"? This action cannot be undone and will remove all associated content and student enrollments.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseDialogs}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-main"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="px-4 py-2 bg-error-main text-white rounded-md hover:bg-error-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-main"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseManagement 