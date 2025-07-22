import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Pagination,
  Alert,
  CardActions,
  Fab,
  LinearProgress,
  Avatar,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Snackbar
} from '@mui/material'
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Add as AddIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  MonetizationOn as PriceIcon,
  Groups as GroupsIcon,
  BookmarkBorder as BookmarkIcon,
  PlayArrow as PlayIcon,
  FilterList as FilterIcon,
  Home as HomeIcon,
  Sort as SortIcon,
  Close as CloseIcon,
  VideoLibrary as ModuleIcon,
  CheckCircle as CompletedIcon,
  AddCircle as AddModuleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import { CourseGridSkeleton, PageLoading } from '../ui/LoadingComponents'

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

const CoursesTest = () => {
  const { user } = useContext(AuthContext);
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
  const [addingModule, setAddingModule] = useState(false)
  
  // Delete and Update states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [editing, setEditing] = useState(false)
  
  // Success/error notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  })
  const navigate = useNavigate();
  // New module form state - updated to match API structure
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
      // Convert duration to number and prepare payload according to API structure
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
        // Show success message
        setSnackbar({
          open: true,
          message: 'Module added successfully!',
          severity: 'success'
        })
        
        // Refresh modules list
        fetchModules(selectedCourse._id)
        
        // Close dialog and reset form
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
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
      
      setModulesError(errorMessage)
    } finally {
      setAddingModule(false)
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
        setSnackbar({
          open: true,
          message: 'Course deleted successfully!',
          severity: 'success'
        })
        setCourses(courses.filter(course => course._id !== courseToDelete._id))
        setFilteredCourses(filteredCourses.filter(course => course._id !== courseToDelete._id))
      }
    } catch (err: any) {
      console.error('Failed to delete course:', err)
      setSnackbar({
        open: true,
        message: 'Failed to delete course. Please try again.',
        severity: 'error'
      })
    } finally {
      setDeleting(false)
      setOpenDeleteDialog(false)
      setCourseToDelete(null)
    }
  }

  const handleEditCourse = (course: Course) => {
    setCourseToEdit(course)

    navigate(`/coursestest/update/${course._id}`);
    // Here you would typically open an edit dialog/form
    // For now, we'll just show a snackbar
    setSnackbar({
      open: true,
      message: 'Edit functionality will be implemented here',
      severity: 'info'
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
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

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageLoading />
        <Box sx={{ mb: 4, pt: 2 }}>
          <Typography variant="h4" component="h1" sx={{ opacity: 0.5 }}>
            Courses
          </Typography>
        </Box>
        <CourseGridSkeleton count={9} />
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 0 }}>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: 40, 
              height: 40,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <SchoolIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold">
                Course Catalog Test
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {totalRecords} courses available
              </Typography>
            </Box>
          </Box>
          
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <Button
              component={RouterLink}
              to="/coursestest/add"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              Create Course
            </Button>
          )}
        </Box>

        {/* Search and Filter Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 25,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
         >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search courses by title, description, or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.default'
                  }
                }}
              />
              
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                alignItems: 'center'
              }}>
                <Button
                  variant={sortByLevel ? "contained" : "outlined"}
                  startIcon={<SortIcon />}
                  onClick={handleFilterToggle}
                  sx={{ 
                    borderRadius: 2,
                    minWidth: 140,
                    transition: 'all 0.2s ease',
                    ...(sortByLevel && {
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)'
                    })
                  }}
                >
                  {sortByLevel ? 'By Date ✓' : 'Sort by Date'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Filter Status */}
        {sortByLevel && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }
              }}
            >
              <SortIcon fontSize="small" />
              Courses sorted by creation date (oldest first)
            </Alert>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setTimeout(() => {
                    const fetchCourses = async () => {
                      try {
                        const res = await axios.get<CoursesResponse>('/api/ngo-lms/courses', {
                          timeout: 15000
                        });
                        if (res.data.success) {
                          setCourses(res.data.data);
                          setFilteredCourses(res.data.data);
                          setTotalRecords(res.data.pagination.totalCount);
                          setTotalPages(res.data.pagination.totalPages);
                          setPage(res.data.pagination.currentPage);
                        }
                      } catch (err: any) {
                        console.error('Retry failed:', err);
                        setError('Retry failed. Please try again later.');
                      } finally {
                        setLoading(false);
                      }
                    };
                    fetchCourses();
                  }, 1000);
                }}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 8, 
              textAlign: 'center', 
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <SchoolIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No courses found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm ? 'Try adjusting your search query' : 'There are currently no courses available'}
            </Typography>
            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <Button
                component={RouterLink}
                to="/courses/add"
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                sx={{ borderRadius: 2 }}
              >
                Create Your First Course
              </Button>
            )}
          </Paper>
         ) : (
          <>
            <Grid container spacing={3}>
              {paginatedCourses.map((course) => (
                <Grid item key={course._id} xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      },
                    }}
                  >
                    {/* Course Actions (Edit/Delete) - Only for instructors/admins */}
                    {user && (user.role === 'instructor' || user.role === 'admin') && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        display: 'flex',
                        gap: 1,
                        zIndex: 1
                      }}>
                        <Tooltip title="Edit course">
                          <IconButton
                            size="small"
                            onClick={() => handleEditCourse(course)}
                            sx={{
                              backgroundColor: 'background.paper',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText'
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete course">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteCourse(course)}
                            sx={{
                              backgroundColor: 'background.paper',
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'error.contrastText'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="h6" 
                          component="h3" 
                          fontWeight="bold" 
                          sx={{ 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '3em'
                          }}
                        >
                          {course.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                            minHeight: '4.5em'
                          }}
                        >
                          {course.description}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(course.createdAt)}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 2
                      }}>
                        {course.price !== undefined ? (
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            ${course.price.toFixed(2)}
                          </Typography>
                        ) : (
                          <Typography variant="h6" color="success.main" fontWeight="bold">
                            Free
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Button 
                          variant={course.progress ? "outlined" : "contained"}
                          size="medium"
                          startIcon={course.progress ? <PlayIcon /> : <SchoolIcon />}
                          onClick={course.progress ? 
                            () => window.location.href = `/courses/${course.slug || course._id}` : 
                            () => handleEnroll(course._id)
                          }
                          sx={{ 
                            py: 1,
                            fontWeight: 600,
                            flexGrow: 1
                          }}
                        >
                          {course.progress ? 'Continue' : 'Start Course'}
                        </Button>
                        
                        {user && (user.role === 'instructor' || user.role === 'admin') && (
                          <Button
                            variant="outlined"
                            size="medium"
                            onClick={() => handleViewModules(course)}
                            sx={{
                              minWidth: 'auto',
                              px: 1
                            }}
                          >
                            <ModuleIcon fontSize="small" />
                          </Button>
                        )}
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages >= 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* Modules Dialog */}
        <Dialog 
          open={openModulesDialog} 
          onClose={() => setOpenModulesDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {selectedCourse?.title} - Modules
              </Typography>
              <IconButton onClick={() => setOpenModulesDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {modulesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : modulesError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {modulesError}
              </Alert>
            ) : modules.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No modules found for this course
                </Typography>
              </Box>
            ) : (
              <List>
                {modules.map((module) => (
                  <ListItem key={module._id} divider>
                    <ListItemIcon>
                      {module.isCompleted ? (
                        <CompletedIcon color="success" />
                      ) : (
                        <ModuleIcon color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={module.title}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {module.description}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Duration: {module.duration} hours • Difficulty: {module.difficulty}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenModulesDialog(false)}
              color="primary"
            >
              Close
            </Button>
            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <Button 
                onClick={handleAddModule}
                variant="contained"
                startIcon={<AddModuleIcon />}
              >
                Add Module
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Add Module Dialog */}
        <Dialog 
          open={openAddModuleDialog} 
          onClose={() => setOpenAddModuleDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Add New Module to {selectedCourse?.title}
              </Typography>
              <IconButton onClick={() => setOpenAddModuleDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box component="form" sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Module Title"
                value={newModule.title}
                onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                margin="normal"
                required
                error={!newModule.title.trim() && newModule.title !== ''}
                helperText={!newModule.title.trim() && newModule.title !== '' ? 'Title is required' : ''}
              />
              <TextField
                fullWidth
                label="Description"
                value={newModule.description}
                onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                margin="normal"
                multiline
                rows={3}
                required
                error={!newModule.description.trim() && newModule.description !== ''}
                helperText={!newModule.description.trim() && newModule.description !== '' ? 'Description is required' : ''}
              />
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={newModule.duration}
                onChange={(e) => setNewModule({...newModule, duration: e.target.value})}
                margin="normal"
                required
                inputProps={{ min: 1, step: 0.5 }}
                error={!newModule.duration || isNaN(parseInt(newModule.duration)) || parseInt(newModule.duration) <= 0}
                helperText={
                  !newModule.duration ? 'Duration is required' :
                  isNaN(parseInt(newModule.duration)) || parseInt(newModule.duration) <= 0 ? 'Duration must be a positive number' : ''
                }
              />
              <TextField
                fullWidth
                label="Video URL"
                value={newModule.videoUrl}
                onChange={(e) => setNewModule({...newModule, videoUrl: e.target.value})}
                margin="normal"
                required
                error={!newModule.videoUrl.trim() && newModule.videoUrl !== ''}
                helperText={!newModule.videoUrl.trim() && newModule.videoUrl !== '' ? 'Video URL is required' : ''}
              />
              <TextField
                fullWidth
                select
                label="Difficulty"
                value={newModule.difficulty}
                onChange={(e) => setNewModule({...newModule, difficulty: e.target.value})}
                margin="normal"
                SelectProps={{
                  native: true,
                }}
              >
                {['Beginner', 'Intermediate', 'Advanced'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Rating"
                type="number"
                value={newModule.rating}
                onChange={(e) => setNewModule({...newModule, rating: parseFloat(e.target.value) || 4.5})}
                margin="normal"
                inputProps={{ min: 1, max: 5, step: 0.1 }}
                helperText="Rating between 1.0 and 5.0"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenAddModuleDialog(false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddModuleSubmit}
              variant="contained"
              disabled={!isModuleFormValid() || addingModule}
              startIcon={addingModule ? <CircularProgress size={20} /> : null}
            >
              {addingModule ? 'Adding...' : 'Add Module'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to delete the course "{courseToDelete?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDeleteDialog(false)}
              color="primary"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteCourse}
              color="error"
              variant="contained"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={20} /> : null}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Floating Action Button */}
        {user && (user.role === 'instructor' || user.role === 'admin') && (
          <Fab
            color="primary"
            aria-label="add"
            component={RouterLink}
            to="/courses/add"
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              display: { xs: 'flex', md: 'none' },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </Box>
  )
}

export default CoursesTest