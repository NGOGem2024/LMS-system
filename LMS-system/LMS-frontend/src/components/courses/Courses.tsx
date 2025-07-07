import { useState, useEffect, useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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
  Link
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
  Sort as SortIcon
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import { CourseGridSkeleton, PageLoading } from '../ui/LoadingComponents'

interface Course {
  _id: string
  title: string
  description: string
  shortDescription?: string
  tags?: string[]
  duration: number
  enrollmentCount: number
  price?: number
  status: string
  level: string
  instructor: {
    _id: string
    name: string
  }
  category: string
  imageUrl?: string
  thumbnail?: string
  enrolledCount: number
  isEnrolled?: boolean
  progress?: number
}

interface CoursesResponse {
  courses: Course[]
  totalRecords: number
}

const Courses = () => {
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
  
  const coursesPerPage = 8

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('Fetching courses...')
        const res = await axios.get<CoursesResponse>('/api/courses', {
          timeout: 10000
        })
        console.log('Courses API response:', res.data)
        
        const { courses, totalRecords } = res.data
        
        setCourses(courses)
        setFilteredCourses(courses)
        setTotalRecords(totalRecords)
        setTotalPages(Math.ceil(courses.length / coursesPerPage))
        
        console.log(`Total records: ${totalRecords}`)
      } catch (err: any) {
        console.error('Failed to load courses:', err)
        if (err.response) {
          console.error('Error status:', err.response.status)
          console.error('Error data:', err.response.data)
          
          if (err.response.status === 503) {
            setError('The server is temporarily unavailable. Please try again in a moment.')
          } else if (err.response.status === 401) {
            setError('Your session has expired. Please log in again.')
          } else {
            setError(err.response.data?.error || 'Failed to load courses. Please try again later.')
          }
        } else if (err.request) {
          console.error('No response received:', err.request)
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
      console.log('Detected navigation from course creation, scheduling retry...')
      const retryTimer = setTimeout(() => {
        console.log('Retrying course fetch after creation...')
        fetchCourses()
      }, 2000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    let results = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Apply level sorting if enabled
    if (sortByLevel) {
      const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
      results = results.sort((a, b) => {
        const aLevel = levelOrder[a.level.toLowerCase() as keyof typeof levelOrder] || 4
        const bLevel = levelOrder[b.level.toLowerCase() as keyof typeof levelOrder] || 4
        return aLevel - bLevel
      })
    }

    setFilteredCourses(results)
    setTotalPages(Math.ceil(results.length / coursesPerPage))
    setPage(1)
  }, [searchTerm, courses, sortByLevel])

  const handleEnroll = async (courseId: string) => {
    try {
      await axios.post(`/api/courses/${courseId}/enroll`)
      
      setCourses(courses.map(course => 
        course._id === courseId 
          ? { ...course, isEnrolled: true, enrolledCount: course.enrolledCount + 1 } 
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

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'error'
      default: return 'default'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
    return `${minutes}m`
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
        <CourseGridSkeleton count={8} />
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
              width: 56, 
              height: 56,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <SchoolIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Course Catalog
              </Typography>
              {/* <Typography variant="body1" color="text.secondary">
                {totalRecords} courses available
              </Typography> */}
            </Box>
          </Box>
          
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <Button
              component={RouterLink}
              to="/courses/add"
              variant="contained"
              size="large"
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
                // variant='standard'
                placeholder="Search courses by title, description, or category..."
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
                  {sortByLevel ? 'By Level ✓' : 'Sort by Level'}
                </Button>
                
                {/* Level indicator chips when sorting is active */}
                {sortByLevel && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label="Beginner" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    <Typography variant="body2" color="text.secondary">→</Typography>
                    <Chip 
                      label="Intermediate" 
                      size="small" 
                      color="warning" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    <Typography variant="body2" color="text.secondary">→</Typography>
                    <Chip 
                      label="Advanced" 
                      size="small" 
                      color="error" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                )}
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
              Courses sorted by difficulty level: Beginner → Intermediate → Advanced
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
                        console.log('Retrying course fetch...');
                        const res = await axios.get<CoursesResponse>('/api/courses', {
                          timeout: 15000
                        });
                        setCourses(res.data.courses);
                        setFilteredCourses(res.data.courses);
                        setTotalRecords(res.data.totalRecords);
                        setTotalPages(Math.ceil(res.data.courses.length / coursesPerPage));
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
                <Grid item key={course._id} xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                        borderColor: 'primary.main'
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={course.thumbnail || course.imageUrl || `https://source.unsplash.com/400x200?education,${course._id}`}
                        alt={course.title}
                        sx={{ 
                          borderRadius: '8px 8px 0 0',
                          objectFit: 'cover'
                        }}
                      />
                      <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                        <Chip 
                          label={course.category} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'background.paper',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                      </Box>
                      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                        <Tooltip title="Save for later">
                          <IconButton 
                            size="small" 
                            sx={{ 
                              bgcolor: 'background.paper',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              '&:hover': { bgcolor: 'background.default' }
                            }}
                          >
                            <BookmarkIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="subtitle1" 
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
                          {course.shortDescription || course.description}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Course Meta Information */}
                      <Stack spacing={1.5}>
                        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {course.instructor.name}
                          </Typography>
                        </Box> */}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDuration(course.duration)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GroupsIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {course.enrolledCount} Ngos
                          </Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mt: 2,
                        gap: 1
                      }}>
                        <Chip 
                          label={course.level.charAt(0).toUpperCase() + course.level.slice(1)} 
                          size="small" 
                          color={getLevelColor(course.level)}
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                        
                        {course.price !== undefined ? (
                          <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                            ${course.price.toFixed(2)}
                          </Typography>
                        ) : (
                          <Typography variant="subtitle1" color="success.main" fontWeight="bold">
                            Free
                          </Typography>
                        )}
                      </Box>

                      {/* Tags */}
                      {course.tags && course.tags.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {course.tags.slice(0, 3).map((tag) => (
                              <Chip 
                                key={tag} 
                                label={tag} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                            {course.tags.length > 3 && (
                              <Chip 
                                label={`+${course.tags.length - 3}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* Progress Bar for Enrolled Courses */}
                      {course.isEnrolled && course.progress !== undefined && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {Math.round(course.progress)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={course.progress} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: 'divider'
                            }}
                          />
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button 
                        fullWidth
                        variant={course.isEnrolled ? "outlined" : "contained"}
                        size="medium"
                        startIcon={course.isEnrolled ? <PlayIcon /> : <SchoolIcon />}
                        onClick={course.isEnrolled ? 
                          () => window.location.href = `/courses/${course._id}` : 
                          () => handleEnroll(course._id)
                        }
                        sx={{ 
                          borderRadius: 1,
                          py: 1,
                          fontWeight: 600
                        }}
                      >
                        {course.isEnrolled ? 'Continue' : 'Enroll Now'}
                        {/* Start Course */}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
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

export default Courses