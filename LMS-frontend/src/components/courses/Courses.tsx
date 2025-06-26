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
  LinearProgress
} from '@mui/material'
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Add as AddIcon
} from '@mui/icons-material'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import { CourseGridSkeleton, PageLoading } from '../ui/LoadingComponents'

interface Course {
  _id: string
  title: string
  description: string
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
  const coursesPerPage = 8

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('Fetching courses...')
        const res = await axios.get<CoursesResponse>('/api/courses', {
          // Add a longer timeout for the request
          timeout: 10000
        })
        console.log('Courses API response:', res.data)
        
        // Extract courses and totalRecords from the response
        const { courses, totalRecords } = res.data
        
        setCourses(courses)
        setFilteredCourses(courses)
        setTotalRecords(totalRecords)
        setTotalPages(Math.ceil(courses.length / coursesPerPage))
        
        console.log(`Total records: ${totalRecords}`)
      } catch (err: any) {
        console.error('Failed to load courses:', err)
        if (err.response) {
          // The request was made and the server responded with a status code
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
          // The request was made but no response was received
          console.error('No response received:', err.request)
          setError('No response from server. Please check your connection.')
        } else {
          // Something happened in setting up the request
          setError('Failed to load courses. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
    
    // Add an automatic retry if coming from course creation
    // This helps when the database might need extra time to reflect new courses
    const fromCreateCourse = window.location.search.includes('newCourse=true')
    if (fromCreateCourse) {
      console.log('Detected navigation from course creation, scheduling retry...')
      // Retry after 2 seconds
      const retryTimer = setTimeout(() => {
        console.log('Retrying course fetch after creation...')
        fetchCourses()
      }, 2000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    const results = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCourses(results)
    setTotalPages(Math.ceil(results.length / coursesPerPage))
    setPage(1) // Reset to first page when search changes
  }, [searchTerm, courses])

  const handleEnroll = async (courseId: string) => {
    try {
      await axios.post(`/api/courses/${courseId}/enroll`)
      
      // Update the courses state to reflect enrollment
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

  const paginatedCourses = filteredCourses.slice(
    (page - 1) * coursesPerPage,
    page * coursesPerPage
  )

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ mr: 1 }} fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            Courses {totalRecords > 0 && <Typography component="span" variant="subtitle1" color="text.secondary">({totalRecords} total)</Typography>}
          </Typography>
        </Box>
        
        {/* Add Course button - only visible to instructors and admins */}
        {user && (user.role === 'instructor' || user.role === 'admin') && (
          <Button
            component={RouterLink}
            to="/courses/add"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Course
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
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
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search courses by title, description, or category"
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
      </Box>
      
      {filteredCourses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No courses found matching your search criteria.
          </Typography>
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <Button
              component={RouterLink}
              to="/courses/add"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add Your First Course
            </Button>
          )}
        </Box>
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
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={course.thumbnail || course.imageUrl || `https://source.unsplash.com/random?education,${course._id}`}
                    alt={course.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      <Chip 
                        label={course.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography gutterBottom variant="h6" component="div">
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {course.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Instructor: {course.instructor.name}
                      </Typography>
                      <Typography variant="body2">
                        Enrolled: {course.enrolledCount} students
                      </Typography>
                    </Box>
                    
                    {course.isEnrolled && course.progress !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress variant="determinate" value={course.progress} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${Math.round(
                            course.progress,
                          )}%`}</Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    {course.isEnrolled ? (
                      <Button 
                        size="small" 
                        component={RouterLink} 
                        to={`/courses/${course._id}`}
                        variant="contained"
                        fullWidth
                      >
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        size="small"
                        onClick={() => handleEnroll(course._id)}
                        variant="contained"
                        fullWidth
                      >
                        Enroll Now
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      )}
      
      {/* Add a floating action button for mobile */}
      {user && (user.role === 'instructor' || user.role === 'admin') && (
        <Fab
          color="primary"
          aria-label="add"
          component={RouterLink}
          to="/courses/add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  )
}

export default Courses 