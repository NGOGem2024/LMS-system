import { useState, useEffect, FormEvent } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  IconButton,
  Divider,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip
} from '@mui/material'
import {
  School as CoursesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenAddDialog = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      instructor: ''
    })
    setFormErrors({})
    setOpenAddDialog(true)
  }

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

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          component={RouterLink}
          to="/admin"
          startIcon={<BackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <CoursesIcon sx={{ mr: 1 }} fontSize="large" color="primary" />
        <Typography variant="h4" component="h1">
          Course Management
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search courses by title, description, category or instructor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={handleOpenAddDialog}
            >
              Add New Course
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="courses table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Enrolled</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCourses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((course) => (
                  <TableRow key={course._id} hover>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>
                      <Chip label={course.category} size="small" />
                    </TableCell>
                    <TableCell>{course.instructor.name}</TableCell>
                    <TableCell>{course.enrolledCount}</TableCell>
                    <TableCell>{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenEditDialog(course)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDeleteDialog(course)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No courses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCourses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Add Course Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>Add New Course</DialogTitle>
        <Box component="form" onSubmit={handleAddCourse} noValidate>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="title"
                  label="Course Title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="description"
                  label="Course Description"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleFormChange}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="category"
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  error={!!formErrors.category}
                  helperText={formErrors.category}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.instructor}>
                  <InputLabel id="instructor-label">Instructor</InputLabel>
                  <Select
                    labelId="instructor-label"
                    id="instructor"
                    name="instructor"
                    value={formData.instructor}
                    label="Instructor"
                    onChange={handleSelectChange}
                  >
                    {instructors.map((instructor) => (
                      <MenuItem key={instructor._id} value={instructor._id}>
                        {instructor.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.instructor && <Typography color="error">{formErrors.instructor}</Typography>}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancel</Button>
            <Button type="submit" variant="contained">Add Course</Button>
          </DialogActions>
        </Box>
      </Dialog>
      
      {/* Edit Course Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>Edit Course</DialogTitle>
        <Box component="form" onSubmit={handleEditCourse} noValidate>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="title"
                  label="Course Title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="description"
                  label="Course Description"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleFormChange}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="category"
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  error={!!formErrors.category}
                  helperText={formErrors.category}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!formErrors.instructor}>
                  <InputLabel id="instructor-label">Instructor</InputLabel>
                  <Select
                    labelId="instructor-label"
                    id="instructor"
                    name="instructor"
                    value={formData.instructor}
                    label="Instructor"
                    onChange={handleSelectChange}
                  >
                    {instructors.map((instructor) => (
                      <MenuItem key={instructor._id} value={instructor._id}>
                        {instructor.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.instructor && <Typography color="error">{formErrors.instructor}</Typography>}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancel</Button>
            <Button type="submit" variant="contained">Update Course</Button>
          </DialogActions>
        </Box>
      </Dialog>
      
      {/* Delete Course Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the course "{selectedCourse?.title}"? This action cannot be undone and will remove all associated content and student enrollments.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleDeleteCourse} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CourseManagement 